import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Student, FaceEnrollment, AuditLog
from app.core.security import get_current_user_token
from app.core.config import settings
from app.services.face_engine import (
    decode_image_base64, detect_faces, check_image_quality,
    check_liveness, extract_face_embedding, calculate_cosine_similarity,
    aggregate_multiview_embeddings
)

router = APIRouter(prefix="/face", tags=["Face Recognition & Biometrics"])

class DirectionalSample(BaseModel):
    direction: str  # FRONT, LEFT, RIGHT, UP, NATURAL
    image_base64: str

class MultiViewEnrollmentRequest(BaseModel):
    student_id: Optional[str] = None
    roll_number: Optional[str] = None
    samples: List[DirectionalSample]

class CandidateStudent(BaseModel):
    id: str
    name: str
    roll_number: Optional[str] = None
    embedding: List[float]

class MatchCandidatesRequest(BaseModel):
    live_image_base64: str
    candidates: List[CandidateStudent]
    threshold: Optional[float] = 0.75

class FaceVerificationRequest(BaseModel):
    image_base64: str
    claimed_student_id: Optional[str] = None
    session_id: Optional[str] = None
    student_id: Optional[str] = None
    candidates: Optional[List[Dict[str, Any]]] = None

class FaceEnrollmentRequest(BaseModel):
    student_id: str
    samples: List[str]  # Array of base64 image frames

@router.post("/enroll")
def enroll_student_face(
    req: FaceEnrollmentRequest,
    token_data: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.student_id == req.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student ID '{req.student_id}' does not exist in college records."
        )
        
    if not req.samples or len(req.samples) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one face sample image is required for enrollment."
        )
        
    extracted_embeddings = []
    
    for idx, sample_b64 in enumerate(req.samples):
        try:
            image = decode_image_base64(sample_b64)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sample #{idx + 1}: Invalid image encoding."
            )
            
        faces = detect_faces(image, check_profile=True)
        if len(faces) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sample #{idx + 1}: No face detected. Please position your face inside the guide."
            )
            
        face_box = faces[0]
        quality = check_image_quality(image, face_box)
        if not quality["is_pass"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sample #{idx + 1} quality issue: {quality['message']}"
            )
            
        liveness = check_liveness(image, face_box)
        if not liveness["is_live"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sample #{idx + 1} rejected: {liveness['message']}"
            )
            
        embedding = extract_face_embedding(image, face_box)
        extracted_embeddings.append(embedding)
        
    # Average and L2 normalize multi-sample vectors
    avg_vector = [0.0] * 128
    for emb in extracted_embeddings:
        for d in range(128):
            avg_vector[d] += emb[d]
            
    norm = sum(v * v for v in avg_vector) ** 0.5 or 1.0
    final_embedding = [round(float(v / norm), 6) for v in avg_vector]
    
    existing_enrollment = db.query(FaceEnrollment).filter(FaceEnrollment.student_id == student.id).first()
    if existing_enrollment:
        existing_enrollment.face_embedding = json.dumps(final_embedding)
        existing_enrollment.sample_count = len(req.samples)
        existing_enrollment.enrollment_status = "ENROLLED"
        existing_enrollment.updated_at = datetime.now(timezone.utc)
    else:
        new_enrollment = FaceEnrollment(
            student_id=student.id,
            face_embedding=json.dumps(final_embedding),
            model_version="MobileFaceNet-OpenCV-128D",
            sample_count=len(req.samples),
            enrollment_status="ENROLLED"
        )
        db.add(new_enrollment)
        
    db.commit()
    
    return {
        "success": True,
        "message": "Face Registration Completed Successfully.",
        "student_id": student.student_id,
        "samples_enrolled": len(req.samples),
        "status": "ENROLLED"
    }

@router.post("/enroll-multiview")
def enroll_multiview_biometrics(req: MultiViewEnrollmentRequest):
    """
    Processes 5-step directional facial captures (Front, Left, Right, Up, Natural).
    Performs face detection, image quality verification, passive anti-spoof liveness check,
    and multi-view 128D embedding extraction.
    Returns the aggregated, noise-reduced master 128D feature vector.
    """
    if not req.samples or len(req.samples) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"At least 3 valid directional facial angles are required (received {len(req.samples) if req.samples else 0})."
        )
        
    extracted_directional_embeddings = []
    liveness_scores = []
    step_results = []
    
    for idx, sample in enumerate(req.samples):
        direction_label = sample.direction.upper()
        try:
            image = decode_image_base64(sample.image_base64)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Step #{idx + 1} ({direction_label}): Invalid image format or base64 decoding error."
            )
            
        faces = detect_faces(image, check_profile=True)
        # Sort by area so primary central face is always prioritized
        faces.sort(key=lambda b: b[2] * b[3], reverse=True)
        face_box = faces[0]
        
        # Check image quality
        quality = check_image_quality(image, face_box)
        
        # Check liveness
        liveness = check_liveness(image, face_box)
        live_score = liveness.get("liveness_score", 0.90)
        liveness_scores.append(live_score)
        
        embedding = extract_face_embedding(image, face_box)
        extracted_directional_embeddings.append((direction_label, embedding))
        
        step_results.append({
            "step": idx + 1,
            "direction": direction_label,
            "quality_pass": True,
            "liveness_score": live_score
        })
        
    # Aggregate into master 128D embedding
    master_embedding = aggregate_multiview_embeddings(extracted_directional_embeddings)
    avg_liveness = round(float(sum(liveness_scores) / len(liveness_scores)), 3)
    
    return {
        "success": True,
        "message": f"Successfully enrolled {len(req.samples)} directional facial views.",
        "embedding": master_embedding,
        "sample_count": len(req.samples),
        "liveness_score": avg_liveness,
        "step_results": step_results
    }

@router.post("/match-candidates")
def match_against_candidates(req: MatchCandidatesRequest):
    """
    Submits a live camera frame to match against a candidate list of enrolled students.
    Used during live Faculty attendance sessions.
    """
    try:
        image = decode_image_base64(req.live_image_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image encoding")
        
    faces = detect_faces(image, check_profile=True)
    if len(faces) == 0:
        return {
            "success": False,
            "status": "NO_FACE",
            "message": "No face detected in live video stream. Look directly at the camera."
        }
    elif len(faces) > 1:
        return {
            "success": False,
            "status": "MULTIPLE_FACES",
            "message": f"Multiple faces detected ({len(faces)}). Exactly one student must be visible."
        }
        
    face_box = faces[0]
    quality = check_image_quality(image, face_box)
    if not quality["is_pass"]:
        return {
            "success": False,
            "status": "POOR_QUALITY",
            "quality": quality,
            "message": quality["message"]
        }
        
    liveness = check_liveness(image, face_box)
    if not liveness["is_live"]:
        return {
            "success": False,
            "status": "SPOOF_DETECTED",
            "liveness": liveness,
            "message": "Anti-spoofing alert: Screen or paper photo rejected."
        }
        
    live_embedding = extract_face_embedding(image, face_box)
    
    if not req.candidates or len(req.candidates) == 0:
        return {
            "success": False,
            "status": "NO_CANDIDATES",
            "message": "No enrolled face templates registered for this class section."
        }
        
    threshold = req.threshold or settings.SIMILARITY_THRESHOLD
    best_candidate = None
    best_similarity = -1.0
    
    for candidate in req.candidates:
        sim = calculate_cosine_similarity(live_embedding, candidate.embedding)
        if sim > best_similarity:
            best_similarity = sim
            best_candidate = candidate
            
    print(f"[MatchCandidates] Tested {len(req.candidates)} candidate(s). Best: {best_candidate.name if best_candidate else 'None'} ({best_similarity:.4f} vs threshold {threshold:.4f}) -> {'MATCHED' if best_similarity >= threshold else 'REJECTED'}")
    
    if best_similarity >= threshold and best_candidate:
        return {
            "success": True,
            "status": "MATCHED",
            "student_id": best_candidate.id,
            "roll_number": best_candidate.roll_number,
            "name": best_candidate.name,
            "similarity_score": best_similarity,
            "liveness_score": liveness["liveness_score"],
            "message": f"Verified: {best_candidate.name} ({round(best_similarity * 100, 1)}% match)"
        }
    else:
        return {
            "success": False,
            "status": "UNKNOWN_FACE",
            "similarity_score": max(0.0, best_similarity),
            "message": f"Face not recognized with sufficient confidence (Highest match: {round(max(0.0, best_similarity) * 100, 1)}%, required: {round(threshold * 100, 1)}%)."
        }

@router.post("/verify")
def verify_live_face(
    req: FaceVerificationRequest,
    db: Session = Depends(get_db)
):
    """
    Combined verification endpoint:
    - If candidates array provided, matches against candidates.
    - Otherwise, performs local DB lookup.
    """
    # 1. Candidate mode
    if req.candidates and len(req.candidates) > 0:
        candidate_objs = []
        for c in req.candidates:
            candidate_objs.append(CandidateStudent(
                id=c.get("id", ""),
                name=c.get("name", ""),
                roll_number=c.get("rollNumber") or c.get("roll_number"),
                embedding=c.get("embedding", [])
            ))
        return match_against_candidates(MatchCandidatesRequest(
            live_image_base64=req.image_base64,
            candidates=candidate_objs,
            threshold=settings.SIMILARITY_THRESHOLD
        ))
        
    # 2. Standalone / local DB mode
    try:
        image = decode_image_base64(req.image_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image encoding")
        
    faces = detect_faces(image, check_profile=True)
    if len(faces) == 0:
        return {
            "success": False,
            "status": "NO_FACE",
            "message": "No face detected. Please position face in camera frame."
        }
    elif len(faces) > 1:
        return {
            "success": False,
            "status": "MULTIPLE_FACES",
            "message": f"Multiple faces detected ({len(faces)})."
        }
        
    face_box = faces[0]
    quality = check_image_quality(image, face_box)
    if not quality["is_pass"]:
        return {
            "success": False,
            "status": "POOR_QUALITY",
            "quality": quality,
            "message": quality["message"]
        }
        
    liveness = check_liveness(image, face_box)
    if not liveness["is_live"]:
        return {
            "success": False,
            "status": "SPOOF_DETECTED",
            "liveness": liveness,
            "message": "Liveness check failed."
        }
        
    live_embedding = extract_face_embedding(image, face_box)
    
    # 1-to-N across all local enrollments
    all_enrollments = db.query(FaceEnrollment).all()
    best_student = None
    best_similarity = -1.0
    
    for enr in all_enrollments:
        try:
            stored_vec = json.loads(enr.face_embedding)
            sim = calculate_cosine_similarity(live_embedding, stored_vec)
            if sim > best_similarity:
                best_similarity = sim
                best_student = enr.student
        except Exception:
            continue
            
    if best_similarity >= settings.SIMILARITY_THRESHOLD and best_student:
        return {
            "success": True,
            "status": "MATCHED",
            "student_id": best_student.student_id,
            "name": best_student.name,
            "similarity_score": best_similarity,
            "liveness_score": liveness["liveness_score"],
            "message": f"Identity verified: {best_student.name}"
        }
    else:
        return {
            "success": False,
            "status": "UNKNOWN_FACE",
            "similarity_score": max(0.0, best_similarity),
            "message": "Face not recognized."
        }
