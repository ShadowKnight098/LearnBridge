const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  role: "admin" | "teacher" | "student";
  preferred_language: string;
  class_id?: string;
  avatar_config?: any;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  user: UserProfile;
}

// Local storage token helper
export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("learnbridge_token");
};

export const setStoredAuth = (data: AuthTokens) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("learnbridge_token", data.access_token);
  if (data.refresh_token) {
    localStorage.setItem("learnbridge_refresh_token", data.refresh_token);
  }
  localStorage.setItem("learnbridge_user", JSON.stringify(data.user));
};

export const getStoredUser = (): UserProfile | null => {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("learnbridge_user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const clearStoredAuth = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("learnbridge_token");
  localStorage.removeItem("learnbridge_refresh_token");
  localStorage.removeItem("learnbridge_user");
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorBody.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  async loginTeacherAdmin(usernameOrEmail: string, password: string): Promise<AuthTokens> {
    const data = await apiFetch<AuthTokens>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: usernameOrEmail,
        email: usernameOrEmail,
        password: password,
      }),
    });
    setStoredAuth(data);
    return data;
  },

  async loginStudent(classCode: string, pin: string): Promise<AuthTokens> {
    const data = await apiFetch<AuthTokens>("/auth/student-login", {
      method: "POST",
      body: JSON.stringify({ class_code: classCode, pin }),
    });
    setStoredAuth(data);
    return data;
  },

  async getMe(): Promise<UserProfile> {
    return apiFetch<UserProfile>("/auth/me");
  },

  // Student endpoints
  async startPracticeSession(type: "diagnostic" | "regular" = "regular", skillId?: string) {
    return apiFetch<{ session_id: string; question: any }>("/practice/sessions", {
      method: "POST",
      body: JSON.stringify({ session_type: type, skill_id: skillId }),
    });
  },

  async submitAnswer(sessionId: string, questionId: string, selectedIndex: number, timeSpentMs: number) {
    return apiFetch<{
      is_correct: boolean;
      correct_answer_index: number;
      explanation: string;
      xp_earned: number;
      next_question: any | null;
      is_completed: boolean;
    }>(`/practice/sessions/${sessionId}/answer`, {
      method: "POST",
      body: JSON.stringify({
        question_id: questionId,
        selected_index: selectedIndex,
        time_spent_ms: timeSpentMs,
      }),
    });
  },

  async completePracticeSession(sessionId: string) {
    return apiFetch<{
      session_id: string;
      total_xp_earned: number;
      streak_count: number;
      new_badges: any[];
      unlocked_chest: boolean;
      bonus_coins: number;
      daily_cap_reached: boolean;
    }>(`/practice/sessions/${sessionId}/complete`, {
      method: "POST",
    });
  },

  async getStudentProgress() {
    return apiFetch<{
      mastery_by_skill: Record<string, { mastery: number; stars: number; name: string }>;
      total_sessions: number;
      accuracy_rate: number;
    }>("/student/me/progress");
  },

  async getStudentRewards() {
    return apiFetch<{
      xp: number;
      level: number;
      streak: number;
      coins: number;
      badges: Array<{ id: string; name: string; description: string; icon: string; unlocked_at: string }>;
      available_badges: Array<{ id: string; name: string; description: string; icon: string; unlocked: boolean }>;
      shop_items: Array<{ id: string; name: string; item_type: string; cost_coins: number; is_owned: boolean; is_equipped: boolean }>;
    }>("/student/me/rewards");
  },

  async buyShopItem(itemId: string) {
    return apiFetch<{ success: boolean; remaining_coins: number }>(`/student/me/shop/${itemId}/buy`, {
      method: "POST",
    });
  },

  async updateAvatar(avatarConfig: any) {
    return apiFetch<{ success: boolean; avatar_config: any }>("/student/me/avatar", {
      method: "PATCH",
      body: JSON.stringify({ avatar_config: avatarConfig }),
    });
  },

  // Teacher endpoints
  async getTeacherClasses() {
    return apiFetch<any[]>("/teacher/classes");
  },

  async getTeacherStudents(classId?: string) {
    const url = classId ? `/teacher/students?class_id=${classId}` : "/teacher/students";
    return apiFetch<any[]>(url);
  },

  async addStudent(data: { name: string; class_id: string; pin: string; roll_number?: string }) {
    return apiFetch<any>("/teacher/students", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async importStudentsCsv(classId: string, csvContent: string) {
    return apiFetch<{ imported_count: number; errors: string[] }>("/teacher/students/import", {
      method: "POST",
      body: JSON.stringify({ class_id: classId, csv_data: csvContent }),
    });
  },

  async createDocument(data: { title: string; grade: number; subject: string; language: string }) {
    return apiFetch<{ document_id: string; title: string }>("/teacher/documents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async uploadDocumentChunks(documentId: string, chunks: Array<{ chunk_index: number; content: string; page_number: number }>) {
    return apiFetch<{ job_id: string; status: string }>(`/teacher/documents/${documentId}/chunks`, {
      method: "POST",
      body: JSON.stringify({ chunks }),
    });
  },

  async getJobStatus(jobId: string) {
    return apiFetch<{ job_id: string; status: string; progress: number; generated_questions: number; error?: string }>(`/teacher/jobs/${jobId}`);
  },

  async getDraftQuestions(status: string = "draft") {
    return apiFetch<any[]>(`/teacher/questions?status=${status}`);
  },

  async reviewQuestion(questionId: string, action: "approve" | "reject" | "edit", editData?: any) {
    return apiFetch<any>(`/teacher/questions/${questionId}`, {
      method: "PATCH",
      body: JSON.stringify({ action, ...editData }),
    });
  },

  async bulkApproveDrafts(questionIds: string[]) {
    return Promise.all(questionIds.map((id) => api.reviewQuestion(id, "approve")));
  },

  async getAssignments() {
    return apiFetch<any[]>("/teacher/assignments");
  },

  async createAssignment(data: { title: string; class_id: string; skill_ids: string[]; target_type: "class" | "student"; target_id?: string; due_date?: string }) {
    return apiFetch<any>("/teacher/assignments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getClassReport(classId: string) {
    return apiFetch<{
      class_id: string;
      class_name: string;
      student_count: number;
      skills: Array<{ id: string; name: string }>;
      heatmap: Array<{
        student_id: string;
        student_name: string;
        scores: Record<string, number>;
      }>;
      most_missed_questions: Array<{
        question_id: string;
        question_text: string;
        skill_name: string;
        failure_rate: number;
      }>;
    }>(`/teacher/reports/class/${classId}`);
  },

  async getStudentReport(studentId: string) {
    return apiFetch<any>(`/teacher/reports/student/${studentId}`);
  },

  async getTeacherAlerts() {
    return apiFetch<any[]>("/teacher/alerts");
  },

  async resolveAlert(alertId: string, note?: string) {
    return apiFetch<any>(`/teacher/alerts/${alertId}/resolve`, {
      method: "PATCH",
      body: JSON.stringify({ note }),
    });
  },

  exportClassCsvUrl(classId: string) {
    const token = getStoredToken();
    return `${API_BASE}/teacher/reports/class/${classId}/export/csv?token=${token}`;
  },

  // Admin endpoints
  async getSchoolReport() {
    return apiFetch<{
      total_students: number;
      total_teachers: number;
      total_sessions: number;
      avg_mastery: number;
      class_comparisons: Array<{
        class_id: string;
        class_name: string;
        teacher_name: string;
        student_count: number;
        avg_mastery: number;
        completion_rate: number;
      }>;
    }>("/admin/reports/school");
  },

  async getTeachers() {
    return apiFetch<any[]>("/admin/teachers");
  },

  async createTeacher(data: { name: string; email: string; password: string }) {
    return apiFetch<any>("/admin/teachers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deactivateTeacher(teacherId: string) {
    return apiFetch<any>(`/admin/teachers/${teacherId}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: false }),
    });
  },

  async getAdminClasses() {
    return apiFetch<any[]>("/admin/classes");
  },

  async createClass(data: { name: string; grade: number; teacher_id: string }) {
    return apiFetch<any>("/admin/classes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
