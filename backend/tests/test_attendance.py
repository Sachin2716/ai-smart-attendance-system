import io
import json
import base64
import numpy as np
import cv2
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db.database import Base, get_db
from app.db.init_db import init_db
from app.db.models import Student, User, FaceEnrollment, AttendanceSession, AttendanceRecord, ClassRoom, Subject
from app.core.security import create_access_token
from app.services.face_engine import extract_face_embedding

# Setup in-memory SQLite database with StaticPool so all connections share the same memory instance
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    init_db(db)
    
    # Create test students and session for unit testing
    cls_obj = db.query(ClassRoom).filter(ClassRoom.full_label == "BCA AIML 3B").first()
    sub_obj = db.query(Subject).filter(Subject.subject_code == "CS301").first()
    
    s1_user = User(
        email="aarav.sharma@caias.edu.in",
        password_hash="test-hash",
        role="student",
        is_verified=True
    )
    db.add(s1_user)
    db.flush()
    
    s1 = Student(
        student_id="24BCA001",
        name="Aarav Sharma",
        college_email="aarav.sharma@caias.edu.in",
        department="Computer Science",
        semester=3,
        section="B",
        class_label="BCA AIML 3B",
        account_status="ACTIVE",
        email_verified=True
    )
    db.add(s1)
    db.flush()
    
    db.add(FaceEnrollment(
        student_id=s1.id,
        face_embedding=json.dumps([0.1] * 128),
        model_version="MobileFaceNet-OpenCV-128D",
        sample_count=4,
        enrollment_status="ENROLLED"
    ))

    s2_user = User(
        email="aditya.kumar@caias.edu.in",
        password_hash="test-hash",
        role="student",
        is_verified=True
    )
    db.add(s2_user)
    db.flush()

    s2 = Student(
        student_id="24BCA002",
        name="Aditya Kumar",
        college_email="aditya.kumar@caias.edu.in",
        department="Computer Science",
        semester=3,
        section="B",
        class_label="BCA AIML 3B",
        account_status="ACTIVE",
        email_verified=True
    )
    db.add(s2)

    db.add(AttendanceSession(
        class_id=cls_obj.id,
        subject_id=sub_obj.id,
        faculty_id=1,
        session_date="2026-10-27",
        start_time="09:00 AM",
        end_time="10:00 AM",
        status="ACTIVE"
    ))
    db.commit()
    db.close()

    yield
    Base.metadata.drop_all(bind=engine)

def create_synthetic_face_image_base64(variation_seed: int = 1, is_spoof: bool = False, is_dark: bool = False) -> str:
    """Generates an in-memory realistic test face frame with eyes, nose, and mouth."""
    img = np.full((320, 320, 3), 180, dtype=np.uint8)
    if is_dark:
        img = np.full((320, 320, 3), 10, dtype=np.uint8)
        
    center = (160, 160)
    # Face skin ellipse
    skin_color = (165, 195, 235)  # BGR skin tone
    cv2.ellipse(img, center, (60, 80), 0, 0, 360, skin_color, -1)
    
    # Eyes
    eye_y = 135
    cv2.circle(img, (135, eye_y), 9, (255, 255, 255), -1)
    cv2.circle(img, (185, eye_y), 9, (255, 255, 255), -1)
    cv2.circle(img, (135 + (variation_seed % 3), eye_y), 4, (60, 40, 20), -1)
    cv2.circle(img, (185 + (variation_seed % 3), eye_y), 4, (60, 40, 20), -1)
    
    # Nose
    cv2.line(img, (160, 150), (160, 175), (140, 160, 200), 2)
    
    # Mouth
    cv2.ellipse(img, (160, 195), (20, 8), 0, 0, 180, (90, 80, 190), -1)
    
    # Add natural texture to pass liveness
    noise = np.random.normal(0, 8, img.shape).astype(np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    
    if is_spoof:
        # Simulate screen monitor glare (monitors display bright concentrated pixel peaks)
        img[100:150, 120:200] = 255  # Overexposed specular glare
        
    _, buffer = cv2.imencode('.jpg', img)
    return "data:image/jpeg;base64," + base64.b64encode(buffer).decode('utf-8')

client = TestClient(app)

# Helper function to get auth headers
def get_auth_headers(email: str, role: str, student_id: str = None, name: str = "User"):
    token = create_access_token({
        "sub": "test-uuid",
        "email": email,
        "role": role,
        "name": name,
        "student_id": student_id
    })
    return {"Authorization": f"Bearer {token}"}

# =========================================================================
# TEST SUITE: MANDATORY 3-STUDENT TEST CASES & ATTENDANCE RULES
# =========================================================================

def test_student_1_already_registered_face_match_pass():
    """
    Student 1: Valid account + enrolled face.
    Presents matching face -> Attendance recorded successfully. PASS.
    """
    db = TestingSessionLocal()
    session = db.query(AttendanceSession).filter(AttendanceSession.status == "ACTIVE").first()
    assert session is not None
    
    # Update Student 1's enrolled embedding to match synthetic face
    s1 = db.query(Student).filter(Student.student_id == "24BCA001").first()
    face_img = create_synthetic_face_image_base64(variation_seed=1)
    
    # Extract actual embedding from synthetic test image to guarantee match
    from app.services.face_engine import decode_image_base64, detect_faces, extract_face_embedding
    img_arr = decode_image_base64(face_img)
    box = detect_faces(img_arr)[0]
    enrolled_vector = extract_face_embedding(img_arr, box)
    s1.enrollment.face_embedding = json.dumps(enrolled_vector)
    db.commit()
    
    headers = get_auth_headers("aarav.sharma@caias.edu.in", "student", student_id="24BCA001", name="Aarav Sharma")
    
    payload = {
        "session_id": session.id,
        "student_id": "24BCA001",
        "image_base64": face_img
    }
    
    response = client.post("/api/attendance/mark", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["student_id"] == "24BCA001"
    assert "Attendance recorded successfully" in data["message"]
    db.close()

def test_student_1_duplicate_attendance_rejected():
    """
    Student 1: Attempts to mark attendance AGAIN for the same session.
    Expected: REJECTED with duplicate warning.
    """
    db = TestingSessionLocal()
    session = db.query(AttendanceSession).filter(AttendanceSession.status == "ACTIVE").first()
    face_img = create_synthetic_face_image_base64(variation_seed=1)
    
    headers = get_auth_headers("aarav.sharma@caias.edu.in", "student", student_id="24BCA001", name="Aarav Sharma")
    payload = {
        "session_id": session.id,
        "student_id": "24BCA001",
        "image_base64": face_img
    }
    
    response = client.post("/api/attendance/mark", json=payload, headers=headers)
    assert response.status_code == 400
    assert "Duplicate attendance attempt" in response.json()["detail"]
    db.close()

def test_student_2_unregistered_rejected():
    """
    Student 2: Valid account, but has NEVER enrolled face biometrics.
    Expected: REJECTED with message:
    'Your face is not registered. Please complete face registration before marking attendance.'
    """
    db = TestingSessionLocal()
    session = db.query(AttendanceSession).filter(AttendanceSession.status == "ACTIVE").first()
    face_img = create_synthetic_face_image_base64(variation_seed=2)
    
    headers = get_auth_headers("aditya.kumar@caias.edu.in", "student", student_id="24BCA002", name="Aditya Kumar")
    payload = {
        "session_id": session.id,
        "student_id": "24BCA002",
        "image_base64": face_img
    }
    
    response = client.post("/api/attendance/mark", json=payload, headers=headers)
    assert response.status_code == 400
    assert "Your face is not registered" in response.json()["detail"]
    db.close()

def test_student_3_registers_for_first_time_and_marks_attendance():
    """
    Student 3:
    1. Registers new account
    2. Verifies college email
    3. Completes face enrollment
    4. Opens active session
    5. Marks attendance -> PASS.
    """
    # 1. Registration
    reg_payload = {
        "name": "Rahul Verma",
        "student_id": "24BCA003",
        "college_email": "rahul.verma@caias.edu.in",
        "department": "Computer Science",
        "semester": 3,
        "section": "B",
        "class_label": "BCA AIML 3B",
        "password": "Password123!"
    }
    reg_resp = client.post("/api/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    verification_token = reg_resp.json()["verification_token"]
    
    # 2. Email Verification
    verify_resp = client.get(f"/api/auth/verify-email?token={verification_token}")
    assert verify_resp.status_code == 200
    assert verify_resp.json()["success"] is True
    
    # 3. Face Enrollment
    headers = get_auth_headers("rahul.verma@caias.edu.in", "student", student_id="24BCA003", name="Rahul Verma")
    face_samples = [
        create_synthetic_face_image_base64(variation_seed=3),
        create_synthetic_face_image_base64(variation_seed=4)
    ]
    enroll_resp = client.post("/api/face/enroll", json={
        "student_id": "24BCA003",
        "samples": face_samples
    }, headers=headers)
    assert enroll_resp.status_code == 200
    assert "Face Registration Completed Successfully" in enroll_resp.json()["message"]
    
    # 4. Mark Attendance
    db = TestingSessionLocal()
    session = db.query(AttendanceSession).filter(AttendanceSession.status == "ACTIVE").first()
    
    att_payload = {
        "session_id": session.id,
        "student_id": "24BCA003",
        "image_base64": face_samples[0]
    }
    att_resp = client.post("/api/attendance/mark", json=att_payload, headers=headers)
    assert att_resp.status_code == 200
    assert att_resp.json()["success"] is True
    assert att_resp.json()["student_id"] == "24BCA003"
    db.close()

def test_student_4_identity_mismatch_rejected():
    """
    Student 4: Registered student presents a completely different person's face.
    Expected: REJECTED with message: 'Identity mismatch. Attendance has not been marked.'
    """
    db = TestingSessionLocal()
    session = db.query(AttendanceSession).filter(AttendanceSession.status == "ACTIVE").first()
    
    # Create different face
    different_person_img = create_synthetic_face_image_base64(variation_seed=99)
    
    # Claiming to be Student 3 (Rahul Verma), but presented face is completely different
    s3 = db.query(Student).filter(Student.student_id == "24BCA003").first()
    # Remove previous attendance record so identity mismatch check is reached
    db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == s3.id,
        AttendanceRecord.attendance_session_id == session.id
    ).delete()
    # Invert stored embedding vector so cosine similarity is near -1.0
    s3.enrollment.face_embedding = json.dumps([-0.08] * 128)
    db.commit()
    
    headers = get_auth_headers("rahul.verma@caias.edu.in", "student", student_id="24BCA003", name="Rahul Verma")
    payload = {
        "session_id": session.id,
        "student_id": "24BCA003",
        "image_base64": different_person_img
    }
    
    response = client.post("/api/attendance/mark", json=payload, headers=headers)
    assert response.status_code == 400
    assert "Identity mismatch" in response.json()["detail"]
    db.close()

def test_student_5_liveness_spoof_rejected():
    """
    Student 5: Attempts photo / screen replay spoof attack.
    Expected: REJECTED by anti-spoof liveness detector.
    """
    db = TestingSessionLocal()
    session = db.query(AttendanceSession).filter(AttendanceSession.status == "ACTIVE").first()
    s1 = db.query(Student).filter(Student.student_id == "24BCA001").first()
    
    # Remove previous attendance record so liveness check is reached
    db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == s1.id,
        AttendanceRecord.attendance_session_id == session.id
    ).delete()
    db.commit()
    
    spoof_image = create_synthetic_face_image_base64(variation_seed=1, is_spoof=True)
    headers = get_auth_headers("aarav.sharma@caias.edu.in", "student", student_id="24BCA001", name="Aarav Sharma")
    
    payload = {
        "session_id": session.id,
        "student_id": "24BCA001",
        "image_base64": spoof_image
    }
    
    response = client.post("/api/attendance/mark", json=payload, headers=headers)
    assert response.status_code == 400
    assert "Liveness check failed" in response.json()["detail"]
    db.close()

def test_manual_attendance_exception_workflow():
    """
    Test faculty-assisted attendance exception workflow:
    1. Student submits exception request
    2. Faculty lists pending exceptions
    3. Faculty approves with reason -> Attendance marked EXCEPTION_APPROVED
    """
    db = TestingSessionLocal()
    session = db.query(AttendanceSession).filter(AttendanceSession.status == "ACTIVE").first()
    
    # Student 2 requests exception
    s2_headers = get_auth_headers("aditya.kumar@caias.edu.in", "student", student_id="24BCA002", name="Aditya Kumar")
    req_resp = client.post("/api/exceptions/request", json={
        "session_id": session.id,
        "reason": "Camera lens shattered on mobile device; student physically verified by professor in class."
    }, headers=s2_headers)
    assert req_resp.status_code == 201
    exc_id = req_resp.json()["exception_id"]
    
    # Faculty reviews and approves
    fac_headers = get_auth_headers("faculty@caias.edu.in", "faculty", name="Dr. Alan Turing")
    review_resp = client.post(f"/api/exceptions/{exc_id}/review", json={
        "action": "APPROVE",
        "remarks": "Student presented college ID card; manually verified attendance in Lab."
    }, headers=fac_headers)
    assert review_resp.status_code == 200
    assert review_resp.json()["status"] == "APPROVED"
    
    # Verify student's attendance record is now EXCEPTION_APPROVED
    s2 = db.query(Student).filter(Student.student_id == "24BCA002").first()
    rec = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == s2.id,
        AttendanceRecord.attendance_session_id == session.id
    ).first()
    assert rec is not None
    assert rec.attendance_status == "EXCEPTION_APPROVED"
    assert rec.approved_by == "Dr. Alan Turing"
    db.close()

def test_attendance_report_exports():
    """
    Test downloading attendance reports in both XLSX and CSV formats.
    """
    admin_headers = get_auth_headers("admin@caias.edu.in", "admin", name="Admin")
    
    # Test CSV Export
    csv_resp = client.get("/api/admin/reports/export?export_format=csv", headers=admin_headers)
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
    assert "USN,Student Name,Class & Section" in csv_resp.text
    
    # Test XLSX Export
    xlsx_resp = client.get("/api/admin/reports/export?export_format=xlsx", headers=admin_headers)
    assert xlsx_resp.status_code == 200
    assert "spreadsheetml.sheet" in xlsx_resp.headers["content-type"]
    assert len(xlsx_resp.content) > 1000
