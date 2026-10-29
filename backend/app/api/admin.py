import io
from datetime import datetime, timezone
from typing import Optional
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Student, Faculty, ClassRoom, Subject, AttendanceSession, AttendanceRecord, AuditLog, FaceEnrollment
from app.core.security import get_current_user_token

router = APIRouter(prefix="/admin", tags=["Administration & Reports"])

@router.get("/stats")
def get_admin_stats(token_data: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    if token_data["role"] not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    total_students = db.query(Student).count()
    total_faculty = db.query(Faculty).count()
    registered_faces = db.query(FaceEnrollment).filter(FaceEnrollment.enrollment_status == "ENROLLED").count()
    awaiting_enrollment = total_students - registered_faces
    total_sessions = db.query(AttendanceSession).count()
    total_records = db.query(AttendanceRecord).filter(AttendanceRecord.attendance_status.in_(["PRESENT", "EXCEPTION_APPROVED"])).count()
    
    return {
        "total_students": total_students,
        "total_faculty": total_faculty,
        "registered_faces": registered_faces,
        "awaiting_enrollment": max(0, awaiting_enrollment),
        "total_sessions": total_sessions,
        "total_attendances_marked": total_records
    }

@router.get("/students")
def list_students(
    search: Optional[str] = None,
    class_label: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    token_data: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    if token_data["role"] not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    query = db.query(Student)
    if class_label:
        query = query.filter(Student.class_label == class_label)
    if search:
        query = query.filter((Student.name.ilike(f"%{search}%")) | (Student.student_id.ilike(f"%{search}%")))
        
    total = query.count()
    students = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "students": [
            {
                "id": s.id,
                "student_id": s.student_id,
                "name": s.name,
                "email": s.college_email,
                "department": s.department,
                "class_label": s.class_label,
                "is_face_enrolled": bool(s.enrollment and s.enrollment.enrollment_status == "ENROLLED"),
                "email_verified": s.email_verified
            }
            for s in students
        ]
    }

@router.get("/audit-logs")
def get_audit_logs(skip: int = 0, limit: int = 50, token_data: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    if token_data["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin role required for audit logs")
        
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": log.id,
            "actor_id": log.actor_id,
            "actor_role": log.actor_role,
            "action": log.action,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "timestamp": log.timestamp.strftime("%Y-%m-%d %I:%M:%S %p"),
            "metadata": log.metadata_json
        }
        for log in logs
    ]

@router.get("/reports/export")
def export_attendance_report(
    class_label: Optional[str] = None,
    export_format: str = Query("xlsx", pattern="^(xlsx|csv)$"),
    token_data: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    if token_data["role"] not in ["admin", "faculty"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    records_query = db.query(AttendanceRecord)
    all_records = records_query.all()
    
    data = []
    for rec in all_records:
        student = db.query(Student).filter(Student.id == rec.student_id).first()
        session = db.query(AttendanceSession).filter(AttendanceSession.id == rec.attendance_session_id).first()
        sub = db.query(Subject).filter(Subject.id == session.subject_id).first() if session else None
        cls_obj = db.query(ClassRoom).filter(ClassRoom.id == session.class_id).first() if session else None
        
        if class_label and cls_obj and cls_obj.full_label != class_label:
            continue
            
        data.append({
            "USN": student.student_id if student else "",
            "Student Name": student.name if student else "",
            "Class & Section": cls_obj.full_label if cls_obj else "",
            "Subject Code": sub.subject_code if sub else "",
            "Subject Name": sub.subject_name if sub else "",
            "Session Date": session.session_date if session else "",
            "Status": rec.attendance_status,
            "Verification Method": rec.verification_method,
            "Marked At": rec.marked_at.strftime("%I:%M:%S %p") if rec.marked_at else "",
            "Similarity Score": rec.similarity_score or "N/A",
            "Liveness Score": rec.liveness_score or "N/A"
        })
        
    df = pd.DataFrame(data)
    if df.empty:
        # Create empty template dataframe
        df = pd.DataFrame(columns=["USN", "Student Name", "Class & Section", "Subject Code", "Subject Name", "Session Date", "Status", "Verification Method", "Marked At", "Similarity Score", "Liveness Score"])
        
    if export_format == "csv":
        csv_bytes = df.to_csv(index=False).encode('utf-8')
        return Response(
            content=csv_bytes,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=SmartFace_Attendance_Report_{datetime.now().strftime('%Y%m%d')}.csv"}
        )
    else:
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name="Attendance Data")
        output.seek(0)
        return Response(
            content=output.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=SmartFace_Attendance_Report_{datetime.now().strftime('%Y%m%d')}.xlsx"}
        )
