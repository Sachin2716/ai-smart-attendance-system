import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.database import get_db
from app.db.models import AttendanceSession, Student, AttendanceRecord, ClassRoom, Subject, AuditLog
from app.core.security import get_current_user_token
from app.core.config import settings
from app.services.face_engine import (
    decode_image_base64, detect_faces, check_image_quality,
    check_liveness, extract_face_embedding, calculate_cosine_similarity
)

router = APIRouter(prefix="/attendance", tags=["Attendance Management"])

class MarkAttendanceRequest(BaseModel):
    session_id: str
    image_base64: str
    student_id: Optional[str] = None

@router.post("/mark")
def mark_attendance(
    req: MarkAttendanceRequest,
    token_data: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    # 1. Determine student identity from token or claimed ID
    auth_role = token_data.get("role")
    target_student_id = token_data.get("student_id") or req.student_id
    
    if not target_student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student identification required."
        )
        
    student = db.query(Student).filter(Student.student_id == target_student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student record for ID '{target_student_id}' does not exist."
        )
        
    # Prevent student from impersonating another student
    if auth_role == "student" and token_data.get("student_id") != student.student_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: You cannot submit attendance for another student."
        )
        
    # 2. Validate Session
    session = db.query(AttendanceSession).filter(AttendanceSession.id == req.session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance session does not exist."
        )
        
    if session.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Attendance session is {session.status}. Attendance can only be marked during an ACTIVE session."
        )
        
    # 3. Validate Student Class Eligibility
    cls_obj = db.query(ClassRoom).filter(ClassRoom.id == session.class_id).first()
    if not cls_obj or student.class_label != cls_obj.full_label:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Class mismatch: Student '{student.name}' belongs to {student.class_label}, but session is for {cls_obj.full_label if cls_obj else 'another class'}."
        )
        
    # 4. Validate Face Biometric Enrollment
    if not student.enrollment or student.enrollment.enrollment_status != "ENROLLED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your face is not registered. Please complete face registration before marking attendance."
        )
        
    # 5. Check Duplicate Attendance in this session
    existing_record = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student.id,
        AttendanceRecord.attendance_session_id == session.id
    ).first()
    if existing_record and existing_record.attendance_status in ["PRESENT", "EXCEPTION_APPROVED"]:
        marked_time = existing_record.marked_at.strftime("%I:%M %p") if existing_record.marked_at else ""
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Duplicate attendance attempt: Already marked PRESENT at {marked_time}."
        )
        
    # 6. Computer Vision Face Analysis
    try:
        image = decode_image_base64(req.image_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Corrupted or invalid camera frame.")
        
    faces = detect_faces(image)
    if len(faces) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No face detected. Please position your face inside the guide."
        )
    elif len(faces) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Multiple faces detected ({len(faces)}). Ensure only you are in front of the camera."
        )
        
    face_box = faces[0]
    
    # Image Quality Check
    quality = check_image_quality(image, face_box)
    if not quality["is_pass"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Quality check failed: {quality['message']}"
        )
        
    # Anti-Spoof Liveness Check
    liveness = check_liveness(image, face_box)
    if not liveness["is_live"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Liveness check failed: Spoof attempt detected (photograph/screen rejected)."
        )
        
    # 7. Embedding Generation & Biometric Matching
    live_embedding = extract_face_embedding(image, face_box)
    stored_embedding = json.loads(student.enrollment.face_embedding)
    
    similarity = calculate_cosine_similarity(live_embedding, stored_embedding)
    
    if similarity < settings.SIMILARITY_THRESHOLD:
        # Check if live face matches someone else's face (impostor check)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Identity mismatch. Attendance has not been marked."
        )
        
    # 8. Record Attendance
    marked_timestamp = datetime.now(timezone.utc)
    try:
        if existing_record:
            existing_record.attendance_status = "PRESENT"
            existing_record.verification_method = "FACE_AI"
            existing_record.marked_at = marked_timestamp
            existing_record.similarity_score = similarity
            existing_record.liveness_score = liveness["liveness_score"]
        else:
            new_record = AttendanceRecord(
                student_id=student.id,
                attendance_session_id=session.id,
                attendance_status="PRESENT",
                verification_method="FACE_AI",
                marked_at=marked_timestamp,
                similarity_score=similarity,
                liveness_score=liveness["liveness_score"]
            )
            db.add(new_record)
            
        db.add(AuditLog(
            actor_id=student.student_id,
            actor_role="student",
            action="ATTENDANCE_MARKED_FACE_AI",
            target_type="attendance_session",
            target_id=session.id,
            metadata_json=f"Similarity: {similarity}, Liveness: {liveness['liveness_score']}"
        ))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duplicate attendance: record already exists for this session."
        )
        
    sub_obj = db.query(Subject).filter(Subject.id == session.subject_id).first()
    
    return {
        "success": True,
        "message": "Attendance recorded successfully.",
        "student_id": student.student_id,
        "student_name": student.name,
        "subject_name": sub_obj.subject_name if sub_obj else "",
        "class_label": cls_obj.full_label if cls_obj else "",
        "marked_at": marked_timestamp.strftime("%I:%M:%S %p"),
        "similarity_score": similarity,
        "liveness_score": liveness["liveness_score"],
        "verification_method": "FACE_AI"
    }

@router.get("/student/{student_id}/history")
def get_student_history(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student.id).order_by(AttendanceRecord.marked_at.desc()).all()
    
    history = []
    for r in records:
        session = db.query(AttendanceSession).filter(AttendanceSession.id == r.attendance_session_id).first()
        sub = db.query(Subject).filter(Subject.id == session.subject_id).first() if session else None
        
        history.append({
            "id": r.id,
            "session_id": r.attendance_session_id,
            "subject_code": sub.subject_code if sub else "",
            "subject_name": sub.subject_name if sub else "Class Session",
            "session_date": session.session_date if session else "",
            "marked_at": r.marked_at.strftime("%I:%M:%S %p") if r.marked_at else "",
            "status": r.attendance_status,
            "verification_method": r.verification_method,
            "similarity_score": r.similarity_score,
            "exception_reason": r.exception_reason,
            "approved_by": r.approved_by
        })
        
    return history

@router.get("/student/{student_id}/stats")
def get_student_stats(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    cls_obj = db.query(ClassRoom).filter(ClassRoom.full_label == student.class_label).first()
    all_sessions = db.query(AttendanceSession).filter(AttendanceSession.class_id == cls_obj.id).all() if cls_obj else []
    
    total_conducted = len(all_sessions)
    attended_records = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student.id,
        AttendanceRecord.attendance_status.in_(["PRESENT", "EXCEPTION_APPROVED"])
    ).all()
    
    total_attended = len(attended_records)
    percentage = round((total_attended / total_conducted * 100), 1) if total_conducted > 0 else 100.0
    
    return {
        "student_id": student.student_id,
        "name": student.name,
        "class_label": student.class_label,
        "total_sessions_conducted": total_conducted,
        "total_sessions_attended": total_attended,
        "overall_percentage": percentage,
        "is_eligible_exam": percentage >= 75.0
    }
