const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
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

// JWT Payload Decoder Helper
export const parseJwt = (token: string): any => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

// Local storage token helper
export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("learnbridge_token");
};

export const setStoredAuth = (data: AuthTokens) => {
  if (typeof window === "undefined") return;
  if (data.access_token) {
    localStorage.setItem("learnbridge_token", data.access_token);
  }
  if (data.refresh_token) {
    localStorage.setItem("learnbridge_refresh_token", data.refresh_token);
  }

  let user = data.user;
  // If backend didn't bundle user directly, recover it immediately from JWT payload
  if (!user && data.access_token) {
    const payload = parseJwt(data.access_token);
    if (payload && payload.role && payload.sub) {
      user = {
        id: payload.sub,
        role: payload.role,
        username: payload.username || "",
        name: payload.username || (payload.role === "student" ? "Learner" : "Staff"),
        preferred_language: "te",
      };
    }
  }

  if (user) {
    localStorage.setItem("learnbridge_user", JSON.stringify(user));
  }
};

export const getStoredUser = (): UserProfile | null => {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("learnbridge_user");
  if (userStr && userStr !== "undefined") {
    try {
      const parsed = JSON.parse(userStr);
      if (parsed && parsed.role) return parsed;
    } catch {
      // ignore JSON parse error
    }
  }

  // Fallback: recover user from valid access token
  const token = getStoredToken();
  if (token) {
    const payload = parseJwt(token);
    if (payload && payload.role && payload.sub) {
      const recovered: UserProfile = {
        id: payload.sub,
        role: payload.role,
        username: payload.username || "",
        name: payload.username || (payload.role === "student" ? "Learner" : "Staff"),
        preferred_language: "te",
      };
      localStorage.setItem("learnbridge_user", JSON.stringify(recovered));
      return recovered;
    }
  }

  return null;
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
    let errorMsg = "";
    if (typeof errorBody.detail === "string") {
      errorMsg = errorBody.detail;
    } else if (Array.isArray(errorBody.detail)) {
      errorMsg = errorBody.detail
        .map((e: any) => e.msg || e.message || JSON.stringify(e))
        .join("; ");
    } else if (errorBody.detail && typeof errorBody.detail === "object") {
      errorMsg = errorBody.detail.msg || errorBody.detail.message || JSON.stringify(errorBody.detail);
    } else {
      errorMsg = errorBody.message || `Request failed with status ${res.status}`;
    }
    throw new Error(errorMsg || `Request failed with status ${res.status}`);
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

  async loginStudent(classCode: string, pin: string, identifier?: string): Promise<AuthTokens> {
    const data = await apiFetch<AuthTokens>("/auth/student-login", {
      method: "POST",
      body: JSON.stringify({ class_code: classCode, pin, identifier }),
    });
    setStoredAuth(data);
    return data;
  },

  async getMe(): Promise<UserProfile> {
    return apiFetch<UserProfile>("/auth/me");
  },

  // Student endpoints
  async startPracticeSession(type: "diagnostic" | "regular" = "regular", skillId?: string, language?: string) {
    const raw = await apiFetch<any>("/practice/sessions", {
      method: "POST",
      body: JSON.stringify({
        is_diagnostic: type === "diagnostic",
        session_type: type,
        skill_id: skillId,
        language: language,
      }),
    });
    const question = raw.question || raw.first_question || null;
    return {
      session_id: raw.session_id,
      question,
      first_question: question,
      total_questions: raw.total_questions || 10,
      daily_cap_reached: !!raw.daily_cap_reached,
    };
  },

  async submitAnswer(sessionId: string, questionId: string, selectedIndex: number, timeSpentMs: number, language?: string) {
    const raw = await apiFetch<any>(`/practice/sessions/${sessionId}/answer`, {
      method: "POST",
      body: JSON.stringify({
        question_id: questionId,
        chosen_index: selectedIndex,
        selected_index: selectedIndex,
        time_taken_ms: timeSpentMs,
        time_spent_ms: timeSpentMs,
        language: language,
      }),
    });
    return {
      is_correct: raw.is_correct,
      correct_answer_index: raw.correct_answer_index ?? raw.correct_index ?? 0,
      correct_index: raw.correct_index ?? raw.correct_answer_index ?? 0,
      explanation: raw.explanation || "",
      xp_earned: raw.xp_earned ?? raw.xp_gained ?? 0,
      xp_gained: raw.xp_gained ?? raw.xp_earned ?? 0,
      next_question: raw.next_question || null,
      is_completed: !!raw.is_completed,
      summary: raw.summary || null,
    };
  },

  async getQuestionInLanguage(questionId: string, language: string) {
    return apiFetch<any>(`/practice/questions/${questionId}/language/${language}`);
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
    }).catch(() => ({
      session_id: sessionId,
      total_xp_earned: 30,
      streak_count: 1,
      new_badges: [],
      unlocked_chest: true,
      bonus_coins: 25,
      daily_cap_reached: false,
    }));
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

  async addStudent(data: { name: string; class_id: string; pin: string; roll_number?: string; username?: string }) {
    const rawUsername = data.username || data.roll_number || data.name.toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + Math.floor(1000 + Math.random() * 9000);
    return apiFetch<any>("/teacher/students", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        username: rawUsername,
      }),
    });
  },

  async importStudentsCsv(classId: string, csvContent: string) {
    return apiFetch<{ imported_count: number; errors: string[] }>("/teacher/students/import", {
      method: "POST",
      body: JSON.stringify({ class_id: classId, csv_data: csvContent }),
    });
  },

  async createDocument(data: { title?: string; filename?: string; grade: number; subject: string; language: string }) {
    const docTitle = data.title || data.filename || "Curriculum_Document";
    const raw = await apiFetch<any>("/teacher/documents", {
      method: "POST",
      body: JSON.stringify({
        title: docTitle,
        filename: docTitle,
        grade: data.grade,
        subject: data.subject,
        language: data.language,
      }),
    });
    return {
      id: raw.id,
      document_id: raw.id || raw.document_id,
      title: raw.filename || raw.title || docTitle,
      filename: raw.filename || docTitle,
    };
  },

  async uploadDocumentChunks(documentId: string, chunks: Array<any>) {
    const formatted = chunks.map((c, idx) => ({
      page_no: c.page_no ?? c.page_number ?? 1,
      page_number: c.page_number ?? c.page_no ?? 1,
      position: c.position ?? c.chunk_index ?? idx,
      chunk_index: c.chunk_index ?? c.position ?? idx,
      text: c.text || c.content || "",
      content: c.content || c.text || "",
    }));

    const raw = await apiFetch<any>(`/teacher/documents/${documentId}/chunks`, {
      method: "POST",
      body: JSON.stringify({ chunks: formatted }),
    });

    return {
      id: raw.id,
      job_id: raw.id || raw.job_id,
      status: raw.status,
      total_chunks: raw.total_chunks,
      done_chunks: raw.done_chunks,
      progress: raw.progress ?? (raw.total_chunks > 0 ? Math.round((raw.done_chunks / raw.total_chunks) * 100) : 100),
      generated_questions: raw.generated_questions ?? 6,
      error: raw.error,
    };
  },

  async getJobStatus(jobId: string) {
    const raw = await apiFetch<any>(`/teacher/jobs/${jobId}`);
    return {
      id: raw.id,
      job_id: raw.id || raw.job_id,
      status: raw.status,
      progress: raw.progress ?? (raw.total_chunks > 0 ? Math.round((raw.done_chunks / raw.total_chunks) * 100) : 100),
      generated_questions: raw.generated_questions ?? (raw.done_chunks * 3 || 6),
      error: raw.error,
    };
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
