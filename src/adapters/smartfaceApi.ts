// Unified SmartFace API Client (Next.js to FastAPI Backend)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export interface ApiUser {
  id: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  name: string;
  student_id?: string;
  department?: string;
  semester?: number;
  section?: string;
  class_label?: string;
  is_face_enrolled?: boolean;
}

export interface ActiveSession {
  id: string;
  class_label: string;
  department: string;
  subject_code: string;
  subject_name: string;
  faculty_name: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'CLOSED';
  present_count: number;
}

export interface AttendanceHistoryItem {
  id: string;
  session_id: string;
  subject_code: string;
  subject_name: string;
  session_date: string;
  marked_at: string;
  status: string;
  verification_method: string;
  similarity_score?: number;
  exception_reason?: string;
  approved_by?: string;
}

export interface StudentStats {
  student_id: string;
  name: string;
  class_label: string;
  total_sessions_conducted: number;
  total_sessions_attended: number;
  overall_percentage: number;
  is_eligible_exam: boolean;
}

class SmartFaceApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('smartface_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('smartface_token', token);
      else localStorage.removeItem('smartface_token');
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('smartface_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const currentToken = this.getToken();
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail = 'API request failed';
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.detail || errorDetail;
      } catch {
        errorDetail = response.statusText || errorDetail;
      }
      throw new Error(errorDetail);
    }

    return response.json();
  }

  // --- AUTHENTICATION ---
  async registerStudent(data: {
    name: string;
    student_id: string;
    college_email: string;
    department: string;
    semester: number;
    section: string;
    class_label: string;
    password: string;
  }) {
    return this.request<{ success: boolean; message: string; verification_token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyEmail(token: string) {
    return this.request<{ success: boolean; message: string }>(`/auth/verify-email?token=${token}`);
  }

  async login(email: string, password: string) {
    const res = await this.request<{
      access_token: string;
      token_type: string;
      role: string;
      email: string;
      name: string;
      student_id?: string;
      is_face_enrolled: boolean;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.setToken(res.access_token);
    return res;
  }

  async getMe(): Promise<ApiUser> {
    return this.request<ApiUser>('/auth/me');
  }

  // --- FACE BIOMETRICS ---
  async enrollFace(student_id: string, samples: string[]) {
    return this.request<{
      success: boolean;
      message: string;
      student_id: string;
      samples_enrolled: number;
      status: string;
    }>('/face/enroll', {
      method: 'POST',
      body: JSON.stringify({ student_id, samples }),
    });
  }

  async getEnrollmentStatus(student_id: string) {
    return this.request<{
      is_enrolled: boolean;
      status: string;
      model_version?: string;
      sample_count?: number;
      enrolled_at?: string;
      message?: string;
    }>(`/face/enroll/status/${student_id}`);
  }

  async verifyLiveFrame(image_base64: string, claimed_student_id?: string) {
    return this.request<{
      success: boolean;
      verification_status: string;
      matched_student_id?: string;
      matched_student_name?: string;
      similarity_score?: number;
      liveness_score?: number;
      message: string;
    }>('/face/verify', {
      method: 'POST',
      body: JSON.stringify({ image_base64, claimed_student_id }),
    });
  }

  // --- ATTENDANCE SESSIONS ---
  async listActiveSessions(class_label?: string): Promise<ActiveSession[]> {
    const query = class_label ? `?class_label=${encodeURIComponent(class_label)}` : '';
    return this.request<ActiveSession[]>(`/sessions/active${query}`);
  }

  async createSession(data: {
    class_label: string;
    subject_code: string;
    start_time: string;
    end_time: string;
    session_date?: string;
  }) {
    return this.request<{ success: boolean; message: string; session_id: string }>('/sessions/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async startSession(session_id: string) {
    return this.request<{ success: boolean; message: string; session_id: string; status: string }>(
      `/sessions/${session_id}/start`,
      { method: 'POST' }
    );
  }

  async closeSession(session_id: string) {
    return this.request<{
      success: boolean;
      message: string;
      session_id: string;
      present_count: number;
      absent_count: number;
      status: string;
    }>(`/sessions/${session_id}/close`, { method: 'POST' });
  }

  async getLiveSessionRoster(session_id: string) {
    return this.request<{
      session_id: string;
      class_label: string;
      subject_name: string;
      faculty_name: string;
      status: string;
      present_count: number;
      absent_count: number;
      total_students: number;
      roster: Array<{
        student_id: string;
        name: string;
        email: string;
        is_enrolled: boolean;
        status: string;
        marked_at: string;
        method: string;
        similarity_score?: number;
        liveness_score?: number;
      }>;
    }>(`/sessions/${session_id}/live`);
  }

  // --- MARK ATTENDANCE ---
  async markAttendance(session_id: string, image_base64: string, student_id?: string) {
    return this.request<{
      success: boolean;
      message: string;
      student_id: string;
      student_name: string;
      subject_name: string;
      class_label: string;
      marked_at: string;
      similarity_score: number;
      liveness_score: number;
      verification_method: string;
    }>('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({ session_id, image_base64, student_id }),
    });
  }

  async getStudentHistory(student_id: string): Promise<AttendanceHistoryItem[]> {
    return this.request<AttendanceHistoryItem[]>(`/attendance/student/${student_id}/history`);
  }

  async getStudentStats(student_id: string): Promise<StudentStats> {
    return this.request<StudentStats>(`/attendance/student/${student_id}/stats`);
  }

  // --- EXCEPTIONS ---
  async requestException(session_id: string, reason: string) {
    return this.request<{ success: boolean; message: string; exception_id: string }>('/exceptions/request', {
      method: 'POST',
      body: JSON.stringify({ session_id, reason }),
    });
  }

  async listPendingExceptions() {
    return this.request<
      Array<{
        id: string;
        student_id: string;
        student_name: string;
        class_label: string;
        session_id: string;
        session_date: string;
        reason: string;
        status: string;
        created_at: string;
      }>
    >('/exceptions/pending');
  }

  async reviewException(exception_id: string, action: 'APPROVE' | 'REJECT', remarks: string) {
    return this.request<{ success: boolean; message: string; status: string }>(
      `/exceptions/${exception_id}/review`,
      {
        method: 'POST',
        body: JSON.stringify({ action, remarks }),
      }
    );
  }

  // --- ADMIN & REPORTS ---
  async getAdminStats() {
    return this.request<{
      total_students: number;
      total_faculty: number;
      registered_faces: number;
      awaiting_enrollment: number;
      total_sessions: number;
      total_attendances_marked: number;
    }>('/admin/stats');
  }

  async getAuditLogs() {
    return this.request<
      Array<{
        id: string;
        actor_id: string;
        actor_role: string;
        action: string;
        target_type: string;
        target_id: string;
        timestamp: string;
        metadata: string;
      }>
    >('/admin/audit-logs');
  }

  getReportDownloadUrl(format: 'xlsx' | 'csv', class_label?: string): string {
    const query = class_label ? `&class_label=${encodeURIComponent(class_label)}` : '';
    const token = this.getToken();
    return `${API_BASE_URL}/admin/reports/export?export_format=${format}${query}${token ? `&token=${token}` : ''}`;
  }
}

export const smartfaceApi = new SmartFaceApiClient();
