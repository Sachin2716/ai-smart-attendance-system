from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import AttendanceException, AttendanceSession, AttendanceRecord, Student, AuditLog
from app.core.security import get_current_user_token

router = APIRouter(prefix="/exceptions", tags=["Attendance Exceptions"])

class RequestExceptionModel(BaseModel):
    session_id: str
    reason: str

class ReviewExceptionModel(BaseModel):
    action: str  # 'APPROVE' or 'REJECT'
    remarks: str

@router.post("/request", status_code=status.HTTP_201_CREATED)
def request_exception(
    req: RequestExceptionModel,
    token_data: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    student_id = token_data.get("student_id")
    if not student_id:
        raise HTTPException(status_code=400, detail="Student credentials required.")
        
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
        
    session = db.query(AttendanceSession).filter(AttendanceSession.id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found.")
        
    new_exc = AttendanceException(
        student_id=student.id,
        session_id=session.id,
        reason=req.reason,
        status="PENDING"
    )
    db.add(new_exc)
    db.commit()
    db.refresh(new_exc)
    
    return {
        "success": True,
        "message": "Manual attendance exception requested. Waiting for faculty review.",
        "exception_id": new_exc.id,
        "status": new_exc.status
    }

@router.get("/pending")
def list_pending_exceptions(
    token_data: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    if token_data["role"] not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    exceptions = db.query(AttendanceException).filter(AttendanceException.status == "PENDING").all()
    
    results = []
    for exc in exceptions:
        student = db.query(Student).filter(Student.id == exc.student_id).first()
        session = db.query(AttendanceSession).filter(AttendanceSession.id == exc.session_id).first()
        results.append({
            "id": exc.id,
            "student_id": student.student_id if student else "",
            "student_name": student.name if student else "",
            "class_label": student.class_label if student else "",
            "session_id": exc.session_id,
            "session_date": session.session_date if session else "",
            "reason": exc.reason,
            "status": exc.status,
            "created_at": exc.created_at.strftime("%Y-%m-%d %I:%M %p")
        })
    return results

@router.post("/{exception_id}/review")
def review_exception(
    exception_id: str,
    req: ReviewExceptionModel,
    token_data: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    if token_data["role"] not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    exc = db.query(AttendanceException).filter(AttendanceException.id == exception_id).first()
    if not exc:
        raise HTTPException(status_code=404, detail="Exception request not found.")
        
    reviewer_name = token_data.get("name", "Faculty")
    action_upper = req.action.upper()
    
    if action_upper == "APPROVE":
        exc.status = "APPROVED"
        exc.reviewed_by = reviewer_name
        exc.reviewed_at = datetime.now(timezone.utc)
        exc.remarks = req.remarks
        
        # Credit student's attendance as EXCEPTION_APPROVED
        existing_rec = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == exc.student_id,
            AttendanceRecord.attendance_session_id == exc.session_id
        ).first()
        
        if existing_rec:
            existing_rec.attendance_status = "EXCEPTION_APPROVED"
            existing_rec.verification_method = "MANUAL_EXCEPTION"
            existing_rec.exception_reason = exc.reason
            existing_rec.approved_by = reviewer_name
            existing_rec.marked_at = datetime.now(timezone.utc)
        else:
            new_rec = AttendanceRecord(
                student_id=exc.student_id,
                attendance_session_id=exc.session_id,
                attendance_status="EXCEPTION_APPROVED",
                verification_method="MANUAL_EXCEPTION",
                exception_reason=exc.reason,
                approved_by=reviewer_name,
                marked_at=datetime.now(timezone.utc)
            )
            db.add(new_rec)
            
    elif action_upper == "REJECT":
        exc.status = "REJECTED"
        exc.reviewed_by = reviewer_name
        exc.reviewed_at = datetime.now(timezone.utc)
        exc.remarks = req.remarks
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'APPROVE' or 'REJECT'.")
        
    db.add(AuditLog(
        actor_id=reviewer_name,
        actor_role=token_data["role"],
        action=f"EXCEPTION_{action_upper}",
        target_type="attendance_exception",
        target_id=exc.id,
        metadata_json=f"Remarks: {req.remarks}"
    ))
    db.commit()
    
    return {
        "success": True,
        "message": f"Exception {action_upper.lower()}d successfully by {reviewer_name}.",
        "status": exc.status
    }
