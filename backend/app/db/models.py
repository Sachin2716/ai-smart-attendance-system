import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Boolean, Float, Text, DateTime,
    ForeignKey, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.db.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # 'student', 'faculty', 'admin'
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Student(Base):
    __tablename__ = "students"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), unique=True, index=True, nullable=False)  # USN / Registration Number
    name = Column(String(100), nullable=False)
    college_email = Column(String(120), unique=True, index=True, nullable=False)
    department = Column(String(50), nullable=False)
    semester = Column(Integer, nullable=False)
    section = Column(String(10), nullable=False)
    class_label = Column(String(50), nullable=False)  # e.g. 'BCA AIML 3B'
    account_status = Column(String(20), default="ACTIVE")
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    enrollment = relationship("FaceEnrollment", back_populates="student", uselist=False, cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="student")

class FaceEnrollment(Base):
    __tablename__ = "face_enrollments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id", ondelete="CASCADE"), unique=True, nullable=False)
    face_embedding = Column(Text, nullable=False)  # JSON-encoded array of normalized vector floats
    model_version = Column(String(50), default="MobileFaceNet-OpenCV-128D")
    sample_count = Column(Integer, default=1)
    enrollment_status = Column(String(20), default="ENROLLED")  # 'ENROLLED', 'PENDING_REVIEW', 'REVOKED'
    enrolled_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    student = relationship("Student", back_populates="enrollment")

class Faculty(Base):
    __tablename__ = "faculty"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    faculty_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    college_email = Column(String(120), unique=True, index=True, nullable=False)
    department = Column(String(50), nullable=False)
    designation = Column(String(80), nullable=False)
    account_status = Column(String(20), default="ACTIVE")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ClassRoom(Base):
    __tablename__ = "classes"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    department = Column(String(50), nullable=False)
    semester = Column(Integer, nullable=False)
    section_name = Column(String(10), nullable=False)
    full_label = Column(String(50), unique=True, nullable=False)  # 'BCA AIML 3B'

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_code = Column(String(20), unique=True, index=True, nullable=False)
    subject_name = Column(String(100), nullable=False)
    department = Column(String(50), nullable=False)
    semester = Column(Integer, nullable=False)

class FacultyAssignment(Base):
    __tablename__ = "faculty_assignments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    faculty_id = Column(String(36), ForeignKey("faculty.id"), nullable=False)
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False)

class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=False)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False)
    faculty_id = Column(String(36), ForeignKey("faculty.id"), nullable=False)
    session_date = Column(String(10), nullable=False)  # 'YYYY-MM-DD'
    start_time = Column(String(10), nullable=False)   # 'HH:MM AM/PM'
    end_time = Column(String(10), nullable=False)     # 'HH:MM AM/PM'
    status = Column(String(20), default="SCHEDULED")  # 'SCHEDULED', 'ACTIVE', 'CLOSED'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    attendance_session_id = Column(String(36), ForeignKey("attendance_sessions.id"), nullable=False)
    attendance_status = Column(String(20), nullable=False)  # 'PRESENT', 'ABSENT', 'EXCEPTION_APPROVED'
    verification_method = Column(String(30), default="FACE_AI")  # 'FACE_AI', 'MANUAL_EXCEPTION'
    marked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    exception_reason = Column(Text, nullable=True)
    approved_by = Column(String(100), nullable=True)
    similarity_score = Column(Float, nullable=True)
    liveness_score = Column(Float, nullable=True)
    
    student = relationship("Student", back_populates="attendance_records")
    session = relationship("AttendanceSession", back_populates="records")
    
    __table_args__ = (
        UniqueConstraint('student_id', 'attendance_session_id', name='uq_student_session_attendance'),
        Index('ix_attendance_student_session', 'student_id', 'attendance_session_id'),
    )

class AttendanceException(Base):
    __tablename__ = "attendance_exceptions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    session_id = Column(String(36), ForeignKey("attendance_sessions.id"), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(20), default="PENDING")  # 'PENDING', 'APPROVED', 'REJECTED'
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_id = Column(String(50), nullable=False)
    actor_role = Column(String(20), nullable=False)
    action = Column(String(50), nullable=False)
    target_type = Column(String(50), nullable=False)
    target_id = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    metadata_json = Column(Text, nullable=True)
