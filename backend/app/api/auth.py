import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, Student, Faculty, AuditLog
from app.core.security import hash_password, verify_password, create_access_token, get_current_user_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

class StudentRegisterRequest(BaseModel):
    name: str
    student_id: str  # USN
    college_email: EmailStr
    department: str
    semester: int
    section: str
    class_label: str
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str
    name: str
    student_id: str | None = None
    is_face_enrolled: bool = False

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_student(req: StudentRegisterRequest, db: Session = Depends(get_db)):
    # 1. Check if email or student_id already registered
    existing_user = db.query(User).filter(User.email == req.college_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="College email is already registered."
        )
    
    existing_student = db.query(Student).filter(Student.student_id == req.student_id).first()
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student ID / USN '{req.student_id}' is already registered."
        )
    
    # 2. Create verification token
    verification_token = secrets.token_urlsafe(32)
    
    # 3. Create User Account
    user = User(
        email=req.college_email,
        password_hash=hash_password(req.password),
        role="student",
        is_verified=False,
        verification_token=verification_token
    )
    db.add(user)
    db.flush()
    
    # 4. Create Student Profile
    student = Student(
        student_id=req.student_id,
        name=req.name,
        college_email=req.college_email,
        department=req.department,
        semester=req.semester,
        section=req.section,
        class_label=req.class_label,
        account_status="ACTIVE",
        email_verified=False
    )
    db.add(student)
    db.flush()
    
    # 5. Log audit
    db.add(AuditLog(
        actor_id=req.student_id,
        actor_role="student",
        action="STUDENT_REGISTERED",
        target_type="student",
        target_id=student.id,
        metadata_json=f"Email: {req.college_email}, USN: {req.student_id}"
    ))
    
    db.commit()
    
    return {
        "success": True,
        "message": "Student registration initiated. Please verify your college email.",
        "verification_token": verification_token,
        "verification_url": f"/api/auth/verify-email?token={verification_token}"
    }

@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token."
        )
    
    user.is_verified = True
    user.verification_token = None
    
    # Also update student table if role is student
    if user.role == "student":
        student = db.query(Student).filter(Student.college_email == user.email).first()
        if student:
            student.email_verified = True
            
    db.commit()
    return {
        "success": True,
        "message": "College email verified successfully. You may now proceed to Face Enrollment."
    }

@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    
    name = "User"
    student_id = None
    is_face_enrolled = False
    
    if user.role == "student":
        student = db.query(Student).filter(Student.college_email == user.email).first()
        if student:
            name = student.name
            student_id = student.student_id
            if student.enrollment and student.enrollment.enrollment_status == "ENROLLED":
                is_face_enrolled = True
    elif user.role == "faculty":
        faculty = db.query(Faculty).filter(Faculty.college_email == user.email).first()
        if faculty:
            name = faculty.name
    elif user.role == "admin":
        name = "Administrator"
        
    token_data = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "name": name,
        "student_id": student_id
    }
    access_token = create_access_token(token_data)
    
    return LoginResponse(
        access_token=access_token,
        role=user.role,
        email=user.email,
        name=name,
        student_id=student_id,
        is_face_enrolled=is_face_enrolled
    )

@router.get("/me")
def get_current_profile(token_data: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == token_data["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    res = {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_verified": user.is_verified,
        "name": token_data.get("name", "User")
    }
    
    if user.role == "student":
        student = db.query(Student).filter(Student.college_email == user.email).first()
        if student:
            res.update({
                "student_id": student.student_id,
                "name": student.name,
                "department": student.department,
                "semester": student.semester,
                "section": student.section,
                "class_label": student.class_label,
                "is_face_enrolled": bool(student.enrollment and student.enrollment.enrollment_status == "ENROLLED"),
                "enrolled_at": student.enrollment.enrolled_at.isoformat() if student.enrollment else None
            })
            
    return res
