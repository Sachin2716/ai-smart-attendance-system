from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import AttendanceSession, ClassRoom, Subject, Faculty, Student, AttendanceRecord, AuditLog
from app.core.security import get_current_user_token

router = APIRouter(prefix="/sessions", tags=["Attendance Sessions"])

class CreateSessionRequest(BaseModel):
    class_label: str  # e.g. 'BCA AIML 3B'
    subject_code: str  # e.g. 'CS301'
    start_time: str
    end_time: str
    session_date: Optional[str] = None

@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_session(
    req: CreateSessionRequest,
    token_data: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    if token_data["role"] not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Only faculty and administrators can create attendance sessions.")
        
    cls_obj = db.query(ClassRoom).filter(ClassRoom.full_label == req.class_label).first()
    if not cls_obj:
        raise HTTPException(status_code=404, detail=f"Class '{req.class_label}' not found.")
        
    sub_obj = db.query(Subject).filter(Subject.subject_code == req.subject_code).first()
    if not sub_obj:
        raise HTTPException(status_code=404, detail=f"Subject '{req.subject_code}' not found.")
        
    faculty = db.query(Faculty).filter(Faculty.college_email == token_data["email"]).first()
    faculty_id = faculty.id if faculty else token_data["sub"]
    
    session_date = req.session_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    new_session = AttendanceSession(
        class_id=cls_obj.id,
        subject_id=sub_obj.id,
        faculty_id=faculty_id,
        session_date=session_date,
        start_time=req.start_time,
        end_time=req.end_time,
        status="SCHEDULED"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    return {
        "success": True,
        "message": f"Attendance session for {cls_obj.full_label} - {sub_obj.subject_name} scheduled.",
        "session_id": new_session.id,
        "status": new_session.status
    }

@router.post("/{session_id}/start")
def start_session(
    session_id: str,
    token_data: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    if token_data["role"] not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found.")
        
    session.status = "ACTIVE"
    session.updated_at = datetime.now(timezone.utc)
    
    db.add(AuditLog(
        actor_id=token_data.get("email", "FACULTY"),
        actor_role=token_data.get("role", "faculty"),
        action="SESSION_STARTED",
        target_type="attendance_session",
        target_id=session.id,
        metadata_json=f"Class ID: {session.class_id}, Subject ID: {session.subject_id}"
    ))
    db.commit()
    
    return {
        "success": True,
        "message": "Attendance session started. Students can now verify and mark attendance.",
        "session_id": session.id,
        "status": session.status
    }

@router.post("/{session_id}/close")
def close_session(
    session_id: str,
    token_data: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    if token_data["role"] not in ["faculty", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found.")
        
    session.status = "CLOSED"
    session.updated_at = datetime.now(timezone.utc)
    
    # Mark all unmarked students in this class as ABSENT
    cls_obj = db.query(ClassRoom).filter(ClassRoom.id == session.class_id).first()
    enrolled_students = db.query(Student).filter(Student.class_label == cls_obj.full_label).all()
    
    present_student_ids = {r.student_id for r in session.records}
    absent_count = 0
    for student in enrolled_students:
        if student.id not in present_student_ids:
            absent_record = AttendanceRecord(
                student_id=student.id,
                attendance_session_id=session.id,
                attendance_status="ABSENT",
                verification_method="SYSTEM_AUTO_CLOSE"
            )
            db.add(absent_record)
            absent_count += 1
            
    db.commit()
    
    return {
        "success": True,
        "message": f"Session closed. {len(present_student_ids)} present, {absent_count} marked absent.",
        "session_id": session.id,
        "present_count": len(present_student_ids),
        "absent_count": absent_count,
        "status": session.status
    }

@router.get("/active")
def list_active_sessions(class_label: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AttendanceSession).filter(AttendanceSession.status == "ACTIVE")
    if class_label:
        cls_obj = db.query(ClassRoom).filter(ClassRoom.full_label == class_label).first()
        if cls_obj:
            query = query.filter(AttendanceSession.class_id == cls_obj.id)
            
    sessions = query.all()
    results = []
    for s in sessions:
        cls_obj = db.query(ClassRoom).filter(ClassRoom.id == s.class_id).first()
        sub_obj = db.query(Subject).filter(Subject.id == s.subject_id).first()
        faculty = db.query(Faculty).filter(Faculty.id == s.faculty_id).first()
        
        present_count = len([r for r in s.records if r.attendance_status in ["PRESENT", "EXCEPTION_APPROVED"]])
        
        results.append({
            "id": s.id,
            "class_label": cls_obj.full_label if cls_obj else "",
            "department": cls_obj.department if cls_obj else "",
            "subject_code": sub_obj.subject_code if sub_obj else "",
            "subject_name": sub_obj.subject_name if sub_obj else "",
            "faculty_name": faculty.name if faculty else "Faculty",
            "session_date": s.session_date,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "status": s.status,
            "present_count": present_count
        })
        
    return results

@router.get("/{session_id}/live")
def get_live_session_roster(session_id: str, db: Session = Depends(get_db)):
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    cls_obj = db.query(ClassRoom).filter(ClassRoom.id == session.class_id).first()
    sub_obj = db.query(Subject).filter(Subject.id == session.subject_id).first()
    faculty = db.query(Faculty).filter(Faculty.id == session.faculty_id).first()
    
    students = db.query(Student).filter(Student.class_label == cls_obj.full_label).all()
    records_map = {r.student_id: r for r in session.records}
    
    roster = []
    present_count = 0
    absent_count = 0
    
    for s in students:
        rec = records_map.get(s.id)
        if rec and rec.attendance_status in ["PRESENT", "EXCEPTION_APPROVED"]:
            status_label = "PRESENT"
            present_count += 1
            marked_time = rec.marked_at.strftime("%I:%M:%S %p") if rec.marked_at else ""
            method = rec.verification_method
        elif rec and rec.attendance_status == "ABSENT":
            status_label = "ABSENT"
            absent_count += 1
            marked_time = ""
            method = "SYSTEM"
        else:
            status_label = "NOT_MARKED"
            marked_time = ""
            method = ""
            
        roster.append({
            "student_id": s.student_id,
            "name": s.name,
            "email": s.college_email,
            "is_enrolled": bool(s.enrollment and s.enrollment.enrollment_status == "ENROLLED"),
            "status": status_label,
            "marked_at": marked_time,
            "method": method,
            "similarity_score": rec.similarity_score if rec else None,
            "liveness_score": rec.liveness_score if rec else None
        })
        
    return {
        "session_id": session.id,
        "class_label": cls_obj.full_label if cls_obj else "",
        "subject_name": sub_obj.subject_name if sub_obj else "",
        "faculty_name": faculty.name if faculty else "Faculty",
        "status": session.status,
        "present_count": present_count,
        "absent_count": absent_count,
        "total_students": len(students),
        "roster": roster
    }
