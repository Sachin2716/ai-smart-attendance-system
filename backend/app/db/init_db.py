import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.db.database import engine, Base, SessionLocal
from app.db.models import (
    User, Student, FaceEnrollment, Faculty, ClassRoom, Subject,
    FacultyAssignment, AttendanceSession, AttendanceRecord, AuditLog
)
from app.core.security import hash_password

def init_db(db: Session):
    # Create all tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # 1. Admin User
    admin = db.query(User).filter(User.email == "admin@caias.edu.in").first()
    if not admin:
        admin = User(
            email="admin@caias.edu.in",
            password_hash=hash_password("admin123"),
            role="admin",
            is_verified=True
        )
        db.add(admin)
    
    # 2. Classes
    classes_data = [
        {"dept": "Computer Science", "sem": 3, "sec": "B", "label": "BCA AIML 3B"},
        {"dept": "Computer Science", "sem": 5, "sec": "A", "label": "BCA AIML 5A"},
        {"dept": "AI & Data Science", "sem": 1, "sec": "A", "label": "B.Tech CSE 1A"},
    ]
    created_classes = {}
    for c in classes_data:
        cls_obj = db.query(ClassRoom).filter(ClassRoom.full_label == c["label"]).first()
        if not cls_obj:
            cls_obj = ClassRoom(
                department=c["dept"],
                semester=c["sem"],
                section_name=c["sec"],
                full_label=c["label"]
            )
            db.add(cls_obj)
            db.flush()
        created_classes[c["label"]] = cls_obj
    
    # 3. Subjects
    subjects_data = [
        {"code": "CS301", "name": "Python Artificial Intelligence", "dept": "Computer Science", "sem": 3},
        {"code": "CS501", "name": "Database Management Systems", "dept": "Computer Science", "sem": 5},
        {"code": "CS302", "name": "Computer Vision & Biometrics", "dept": "Computer Science", "sem": 3},
    ]
    created_subjects = {}
    for s in subjects_data:
        sub_obj = db.query(Subject).filter(Subject.subject_code == s["code"]).first()
        if not sub_obj:
            sub_obj = Subject(
                subject_code=s["code"],
                subject_name=s["name"],
                department=s["dept"],
                semester=s["sem"]
            )
            db.add(sub_obj)
            db.flush()
        created_subjects[s["code"]] = sub_obj
    
    # 4. Faculty
    faculty_user = db.query(User).filter(User.email == "faculty@caias.edu.in").first()
    if not faculty_user:
        faculty_user = User(
            email="faculty@caias.edu.in",
            password_hash=hash_password("faculty123"),
            role="faculty",
            is_verified=True
        )
        db.add(faculty_user)
        db.flush()
        
    fac_obj = db.query(Faculty).filter(Faculty.college_email == "faculty@caias.edu.in").first()
    if not fac_obj:
        fac_obj = Faculty(
            faculty_id="FAC-101",
            name="Dr. Alan Turing",
            college_email="faculty@caias.edu.in",
            department="Computer Science",
            designation="Professor & Head of AI",
            account_status="ACTIVE"
        )
        db.add(fac_obj)
        db.flush()
    
    # Faculty Assignment
    primary_class = created_classes.get("BCA AIML 3B")
    primary_subject = created_subjects.get("CS301")
    if primary_class and primary_subject and fac_obj:
        fa = db.query(FacultyAssignment).filter(
            FacultyAssignment.faculty_id == fac_obj.id,
            FacultyAssignment.class_id == primary_class.id,
            FacultyAssignment.subject_id == primary_subject.id
        ).first()
        if not fa:
            db.add(FacultyAssignment(
                faculty_id=fac_obj.id,
                class_id=primary_class.id,
                subject_id=primary_subject.id
            ))
            
    # Zero mock students and zero mock sessions seeded. Ready for live multi-view registrations.
    db.commit()
    print("[OK] SmartFace database initialized cleanly (Zero mock students, zero fake attendance).")

if __name__ == "__main__":
    db = SessionLocal()
    init_db(db)
    db.close()
