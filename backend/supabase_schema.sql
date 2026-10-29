-- =========================================================================
-- SMARTFACE ATTENDANCE MANAGEMENT SYSTEM — SUPABASE POSTGRESQL SCHEMA (DDL)
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE (Authentication & Roles)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) UNIQUE NOT NULL, -- Institutional USN
    name VARCHAR(100) NOT NULL,
    college_email VARCHAR(120) UNIQUE NOT NULL,
    department VARCHAR(50) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section VARCHAR(10) NOT NULL,
    class_label VARCHAR(50) NOT NULL,
    account_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'ALUMNI')),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FACE ENROLLMENTS TABLE (Biometric Representation)
CREATE TABLE IF NOT EXISTS face_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    face_embedding JSONB NOT NULL, -- 128D deep feature vector representation
    model_version VARCHAR(50) DEFAULT 'MobileFaceNet-OpenCV-128D',
    sample_count INT DEFAULT 1,
    enrollment_status VARCHAR(20) DEFAULT 'ENROLLED' CHECK (enrollment_status IN ('ENROLLED', 'PENDING_REVIEW', 'REVOKED')),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. FACULTY TABLE
CREATE TABLE IF NOT EXISTS faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    college_email VARCHAR(120) UNIQUE NOT NULL,
    department VARCHAR(50) NOT NULL,
    designation VARCHAR(80) NOT NULL,
    account_status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CLASSES & SECTIONS TABLE
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department VARCHAR(50) NOT NULL,
    semester INT NOT NULL,
    section_name VARCHAR(10) NOT NULL,
    full_label VARCHAR(50) UNIQUE NOT NULL -- e.g. 'BCA AIML 3B'
);

-- 6. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    semester INT NOT NULL
);

-- 7. FACULTY ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS faculty_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE
);

-- 8. ATTENDANCE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ACTIVE', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. ATTENDANCE RECORDS TABLE (With Database-Level Duplicate Protection)
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attendance_session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    attendance_status VARCHAR(20) NOT NULL CHECK (attendance_status IN ('PRESENT', 'ABSENT', 'EXCEPTION_APPROVED')),
    verification_method VARCHAR(30) DEFAULT 'FACE_AI' CHECK (verification_method IN ('FACE_AI', 'MANUAL_EXCEPTION', 'SYSTEM_AUTO_CLOSE')),
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exception_reason TEXT,
    approved_by VARCHAR(100),
    similarity_score FLOAT,
    liveness_score FLOAT,
    CONSTRAINT uq_student_session_attendance UNIQUE (student_id, attendance_session_id)
);

-- 10. ATTENDANCE EXCEPTIONS TABLE
CREATE TABLE IF NOT EXISTS attendance_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id VARCHAR(50) NOT NULL,
    actor_role VARCHAR(20) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata_json TEXT
);

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_student_usn ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_student_email ON students(college_email);
CREATE INDEX IF NOT EXISTS idx_attendance_records_lookup ON attendance_records(student_id, attendance_session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_class_date ON attendance_sessions(class_id, session_date);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE face_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Students can view only their own attendance records
CREATE POLICY "Student Attendance View Policy" ON attendance_records
    FOR SELECT USING (
        auth.uid() = student_id OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('faculty', 'admin'))
    );

-- Only backend or admin can access face biometric representations
CREATE POLICY "Protected Biometric Access Policy" ON face_enrollments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );
