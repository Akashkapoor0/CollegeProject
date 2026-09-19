import { Html5Qrcode } from "html5-qrcode";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api, setAuthToken } from "./api.js";

const ROLE_HOME = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/student"
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const defaultStudentForm = {
  editingId: "",
  name: "",
  email: "",
  password: "",
  rollNumber: "",
  departmentId: "",
  semester: "1",
  sectionId: ""
};

const defaultTeacherForm = {
  editingId: "",
  name: "",
  email: "",
  password: "",
  teacherCode: "",
  departmentId: ""
};

const defaultAcademicForms = {
  department: { name: "", code: "" },
  section: { name: "", departmentId: "", semester: "1" },
  subject: { name: "", code: "", departmentId: "", semester: "1" },
  assignment: { teacherId: "", subjectId: "", sectionId: "" },
  timetable: {
    teacherId: "",
    subjectId: "",
    sectionId: "",
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "10:00",
    room: ""
  }
};

const defaultReportFilters = {
  date: new Date().toISOString().slice(0, 10),
  sectionId: "",
  subjectId: ""
};

const ADMIN_NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "academic", label: "Academic" },
  { id: "students", label: "Students" },
  { id: "teachers", label: "Teachers" },
  { id: "assignments", label: "Assignments" },
  { id: "timetable", label: "Timetable" },
  { id: "reports", label: "Reports" }
];

const TEACHER_NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "classes", label: "Classes" },
  { id: "qr", label: "Live QR" },
  { id: "attendance", label: "Attendance" }
];

const STUDENT_NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "scan", label: "Scan QR" },
  { id: "history", label: "History" }
];

const getStoredSession = () => {
  const token = window.localStorage.getItem("smartAttendanceToken");
  const rawUser = window.localStorage.getItem("smartAttendanceUser");

  return {
    token: token || "",
    user: rawUser ? JSON.parse(rawUser) : null
  };
};

const saveSession = (token, user) => {
  window.localStorage.setItem("smartAttendanceToken", token);
  window.localStorage.setItem("smartAttendanceUser", JSON.stringify(user));
};

const clearSession = () => {
  window.localStorage.removeItem("smartAttendanceToken");
  window.localStorage.removeItem("smartAttendanceUser");
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
};

const formatStatus = (status) =>
  status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong";

function App() {
  const initialSession = useMemo(getStoredSession, []);
  const [authState, setAuthState] = useState({
    token: initialSession.token,
    user: initialSession.user,
    loading: Boolean(initialSession.token)
  });

  const loadCurrentUser = useCallback(async () => {
    if (!initialSession.token) {
      setAuthState({ token: "", user: null, loading: false });
      return;
    }

    try {
      setAuthToken(initialSession.token);
      const { data } = await api.get("/auth/me");
      saveSession(initialSession.token, data.user);
      setAuthState({ token: initialSession.token, user: data.user, loading: false });
    } catch {
      setAuthToken("");
      clearSession();
      setAuthState({ token: "", user: null, loading: false });
    }
  }, [initialSession.token]);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const handleLogin = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    saveSession(data.token, data.user);
    setAuthToken(data.token);
    setAuthState({ token: data.token, user: data.user, loading: false });
  };

  const handleLogout = () => {
    clearSession();
    setAuthToken("");
    setAuthState({ token: "", user: null, loading: false });
  };

  if (authState.loading) {
    return <SplashScreen label="Restoring your session..." />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          authState.user ? (
            <Navigate to={ROLE_HOME[authState.user.role]} replace />
          ) : (
            <LoginPage onLogin={handleLogin} />
          )
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute authState={authState} role="admin">
            <AdminDashboard user={authState.user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher"
        element={
          <ProtectedRoute authState={authState} role="teacher">
            <TeacherDashboard user={authState.user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student"
        element={
          <ProtectedRoute authState={authState} role="student">
            <StudentDashboard user={authState.user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          authState.user ? (
            <Navigate to={ROLE_HOME[authState.user.role]} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function ProtectedRoute({ authState, role, children }) {
  if (!authState.user) {
    return <Navigate to="/login" replace />;
  }

  if (authState.user.role !== role) {
    return <Navigate to={ROLE_HOME[authState.user.role]} replace />;
  }

  return children;
}

function SplashScreen({ label }) {
  return (
    <div className="splash-shell">
      <div className="splash-card">
        <div className="orb" />
        <h1>Smart Attendance</h1>
        <p>{label}</p>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await onLogin(form.email, form.password);
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <section className="marketing-panel">
        <div className="badge-chip">A2 College QR Attendance</div>
        <h1>Smart Attendance Management System</h1>
        <p>
          Track classroom attendance through live QR sessions, role-based dashboards,
          late-request approvals, and section-wise reporting.
        </p>
        <div className="hero-grid">
          <InfoTile title="Admin Control" text="Manage students, teachers, subjects, sections, and timetable." />
          <InfoTile title="Teacher Live QR" text="Start today's class, rotate QR automatically, and review late requests." />
          <InfoTile title="Student Scan" text="Scan only while signed in and only for your active class section." />
        </div>
      </section>

      <section className="login-panel">
        <div className="badge-chip alt">One Login Page, All Roles</div>
        <h2>Sign in with college email</h2>
        <form className="stack-form" onSubmit={handleSubmit}>
          <label>
            <span>College Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="name@a2college.edu"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Enter your password"
              required
            />
          </label>

          {error ? <div className="feedback error">{error}</div> : null}

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="login-hint">
          Seed the first admin from the server, then use the admin dashboard to create teacher and student accounts.
        </div>
      </section>
    </div>
  );
}

function AdminDashboard({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState("overview");
  const [dashboard, setDashboard] = useState(null);
  const [bootstrap, setBootstrap] = useState(null);
  const [studentForm, setStudentForm] = useState(defaultStudentForm);
  const [teacherForm, setTeacherForm] = useState(defaultTeacherForm);
  const [academicForms, setAcademicForms] = useState(defaultAcademicForms);
  const [reportFilters, setReportFilters] = useState(defaultReportFilters);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const loadAdminData = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }
    try {
      const [dashboardResponse, bootstrapResponse] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/bootstrap")
      ]);

      setDashboard(dashboardResponse.data);
      setBootstrap(bootstrapResponse.data);
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadAdminData(true);
  }, [loadAdminData]);

  const runAction = async (key, action, successMessage, resetForm) => {
    setBusyKey(key);
    setFeedback("");
    setError("");

    try {
      await action();
      if (resetForm) {
        resetForm();
      }
      await loadAdminData();
      setFeedback(successMessage);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyKey("");
    }
  };

  const submitDepartment = async (event) => {
    event.preventDefault();
    await runAction(
      "department",
      () => api.post("/admin/departments", academicForms.department),
      "Department created",
      () =>
        setAcademicForms((current) => ({
          ...current,
          department: defaultAcademicForms.department
        }))
    );
  };

  const submitSection = async (event) => {
    event.preventDefault();
    await runAction(
      "section",
      () =>
        api.post("/admin/sections", {
          ...academicForms.section,
          semester: Number(academicForms.section.semester)
        }),
      "Section created",
      () =>
        setAcademicForms((current) => ({
          ...current,
          section: defaultAcademicForms.section
        }))
    );
  };

  const submitSubject = async (event) => {
    event.preventDefault();
    await runAction(
      "subject",
      () =>
        api.post("/admin/subjects", {
          ...academicForms.subject,
          semester: Number(academicForms.subject.semester)
        }),
      "Subject created",
      () =>
        setAcademicForms((current) => ({
          ...current,
          subject: defaultAcademicForms.subject
        }))
    );
  };

  const submitStudent = async (event) => {
    event.preventDefault();

    const payload = {
      name: studentForm.name,
      email: studentForm.email,
      password: studentForm.password,
      rollNumber: studentForm.rollNumber,
      departmentId: studentForm.departmentId,
      semester: Number(studentForm.semester),
      sectionId: studentForm.sectionId
    };

    await runAction(
      "student",
      () =>
        studentForm.editingId
          ? api.put(`/admin/students/${studentForm.editingId}`, payload)
          : api.post("/admin/students", payload),
      studentForm.editingId ? "Student updated" : "Student created",
      () => setStudentForm(defaultStudentForm)
    );
  };

  const submitTeacher = async (event) => {
    event.preventDefault();

    const payload = {
      name: teacherForm.name,
      email: teacherForm.email,
      password: teacherForm.password,
      departmentId: teacherForm.departmentId
    };

    await runAction(
      "teacher",
      () =>
        teacherForm.editingId
          ? api.put(`/admin/teachers/${teacherForm.editingId}`, {
              ...payload,
              teacherCode: teacherForm.teacherCode
            })
          : api.post("/admin/teachers", {
              ...payload,
              teacherId: teacherForm.teacherCode
            }),
      teacherForm.editingId ? "Teacher updated" : "Teacher created",
      () => setTeacherForm(defaultTeacherForm)
    );
  };

  const submitAssignment = async (event) => {
    event.preventDefault();
    await runAction(
      "assignment",
      () => api.post("/admin/assignments", academicForms.assignment),
      "Teacher assignment created",
      () =>
        setAcademicForms((current) => ({
          ...current,
          assignment: defaultAcademicForms.assignment
        }))
    );
  };

  const submitTimetable = async (event) => {
    event.preventDefault();
    await runAction(
      "timetable",
      () => api.post("/admin/timetables", academicForms.timetable),
      "Timetable entry created",
      () =>
        setAcademicForms((current) => ({
          ...current,
          timetable: defaultAcademicForms.timetable
        }))
    );
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Delete this student account?")) {
      return;
    }

    await runAction("delete-student", () => api.delete(`/admin/students/${studentId}`), "Student deleted");
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm("Delete this teacher account?")) {
      return;
    }

    await runAction("delete-teacher", () => api.delete(`/admin/teachers/${teacherId}`), "Teacher deleted");
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm("Delete this teacher assignment?")) {
      return;
    }

    await runAction(
      "delete-assignment",
      () => api.delete(`/admin/assignments/${assignmentId}`),
      "Assignment deleted"
    );
  };

  const handleDeleteTimetable = async (timetableId) => {
    if (!window.confirm("Delete this timetable entry?")) {
      return;
    }

    await runAction(
      "delete-timetable",
      () => api.delete(`/admin/timetables/${timetableId}`),
      "Timetable deleted"
    );
  };

  const handleExportReport = async () => {
    setBusyKey("export");
    setFeedback("");
    setError("");

    try {
      const response = await api.get("/admin/reports/export", {
        params: {
          date: reportFilters.date,
          sectionId: reportFilters.sectionId || undefined,
          subjectId: reportFilters.subjectId || undefined
        },
        responseType: "blob"
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = `attendance-report-${reportFilters.date}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(blobUrl);
      setFeedback("Excel report downloaded");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyKey("");
    }
  };

  if (loading) {
    return <SplashScreen label="Loading admin workspace..." />;
  }

  const students = bootstrap?.students || [];
  const teachers = bootstrap?.teachers || [];
  const assignments = bootstrap?.assignments || [];
  const timetables = bootstrap?.timetables || [];
  const departments = bootstrap?.departments || [];
  const sections = bootstrap?.sections || [];
  const subjects = bootstrap?.subjects || [];

  return (
    <DashboardShell
      title="Admin Control Center"
      user={user}
      onLogout={onLogout}
      navItems={ADMIN_NAV_ITEMS}
      activeNav={activeNav}
      onChangeNav={setActiveNav}
    >
      {feedback ? <div className="feedback success">{feedback}</div> : null}
      {error ? <div className="feedback error">{error}</div> : null}

      {activeNav === "overview" ? (
        <div className="stack-panel">
          <div className="stats-grid">
            <StatCard label="Students" value={dashboard?.metrics.students || 0} />
            <StatCard label="Teachers" value={dashboard?.metrics.teachers || 0} />
            <StatCard label="Departments" value={dashboard?.metrics.departments || 0} />
            <StatCard label="Subjects" value={dashboard?.metrics.subjects || 0} />
            <StatCard label="Sections" value={dashboard?.metrics.sections || 0} />
            <StatCard label="Pending Late Requests" value={dashboard?.metrics.pendingLateRequests || 0} />
          </div>

          <div className="dashboard-grid two-column">
            <Panel title="Recent Students">
              <DataTable
                columns={["Name", "Roll", "Section", "Email"]}
                rows={students.slice(0, 6).map((student) => [
                  student.user?.name || "-",
                  student.rollNumber,
                  `${student.department?.code || "-"} / Sem ${student.semester} / ${student.section?.name || "-"}`,
                  student.user?.email || "-"
                ])}
              />
            </Panel>

            <Panel title="Recent Teachers">
              <DataTable
                columns={["Name", "Teacher ID", "Department", "Email"]}
                rows={teachers.slice(0, 6).map((teacher) => [
                  teacher.user?.name || "-",
                  teacher.teacherId,
                  teacher.department?.name || "-",
                  teacher.user?.email || "-"
                ])}
              />
            </Panel>
          </div>
        </div>
      ) : null}

      {activeNav === "academic" ? (
        <div className="dashboard-grid">
          <Panel title="Department">
            <form className="stack-form compact" onSubmit={submitDepartment}>
              <label>
                <span>Name</span>
                <input
                  value={academicForms.department.name}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      department: { ...current.department, name: event.target.value }
                    }))
                  }
                  required
                />
              </label>
              <label>
                <span>Code</span>
                <input
                  value={academicForms.department.code}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      department: { ...current.department, code: event.target.value }
                    }))
                  }
                  required
                />
              </label>
              <button className="primary-button" type="submit" disabled={busyKey === "department"}>
                {busyKey === "department" ? "Saving..." : "Create Department"}
              </button>
            </form>
          </Panel>

          <Panel title="Section">
            <form className="stack-form compact" onSubmit={submitSection}>
              <label>
                <span>Name</span>
                <input
                  value={academicForms.section.name}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      section: { ...current.section, name: event.target.value }
                    }))
                  }
                  placeholder="A"
                  required
                />
              </label>
              <label>
                <span>Department</span>
                <select
                  value={academicForms.section.departmentId}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      section: { ...current.section, departmentId: event.target.value }
                    }))
                  }
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department._id} value={department._id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Semester</span>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={academicForms.section.semester}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      section: { ...current.section, semester: event.target.value }
                    }))
                  }
                  required
                />
              </label>
              <button className="secondary-button" type="submit" disabled={busyKey === "section"}>
                {busyKey === "section" ? "Saving..." : "Create Section"}
              </button>
            </form>
          </Panel>

          <Panel title="Subject">
            <form className="stack-form compact" onSubmit={submitSubject}>
              <label>
                <span>Name</span>
                <input
                  value={academicForms.subject.name}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      subject: { ...current.subject, name: event.target.value }
                    }))
                  }
                  required
                />
              </label>
              <label>
                <span>Code</span>
                <input
                  value={academicForms.subject.code}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      subject: { ...current.subject, code: event.target.value }
                    }))
                  }
                  required
                />
              </label>
              <label>
                <span>Department</span>
                <select
                  value={academicForms.subject.departmentId}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      subject: { ...current.subject, departmentId: event.target.value }
                    }))
                  }
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department._id} value={department._id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Semester</span>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={academicForms.subject.semester}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      subject: { ...current.subject, semester: event.target.value }
                    }))
                  }
                  required
                />
              </label>
              <button className="secondary-button" type="submit" disabled={busyKey === "subject"}>
                {busyKey === "subject" ? "Saving..." : "Create Subject"}
              </button>
            </form>
          </Panel>
        </div>
      ) : null}

      {activeNav === "students" ? (
        <div className="dashboard-grid two-column">
          <Panel title={studentForm.editingId ? "Edit Student" : "Student Account"}>
            <form className="stack-form compact" onSubmit={submitStudent}>
              <label>
                <span>Name</span>
                <input
                  value={studentForm.name}
                  onChange={(event) => setStudentForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={studentForm.email}
                  onChange={(event) => setStudentForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Password {studentForm.editingId ? "(leave blank to keep current)" : "(optional)"}</span>
                <input
                  type="password"
                  value={studentForm.password}
                  onChange={(event) => setStudentForm((current) => ({ ...current, password: event.target.value }))}
                />
              </label>
              <label>
                <span>Roll Number</span>
                <input
                  value={studentForm.rollNumber}
                  onChange={(event) => setStudentForm((current) => ({ ...current, rollNumber: event.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Department</span>
                <select
                  value={studentForm.departmentId}
                  onChange={(event) => setStudentForm((current) => ({ ...current, departmentId: event.target.value }))}
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department._id} value={department._id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Semester</span>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={studentForm.semester}
                  onChange={(event) => setStudentForm((current) => ({ ...current, semester: event.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Section</span>
                <select
                  value={studentForm.sectionId}
                  onChange={(event) => setStudentForm((current) => ({ ...current, sectionId: event.target.value }))}
                  required
                >
                  <option value="">Select section</option>
                  {sections.map((section) => (
                    <option key={section._id} value={section._id}>
                      {section.department?.code} / Sem {section.semester} / {section.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="button-row">
                <button className="primary-button" type="submit" disabled={busyKey === "student"}>
                  {busyKey === "student"
                    ? "Saving..."
                    : studentForm.editingId
                      ? "Update Student"
                      : "Create Student"}
                </button>
                {studentForm.editingId ? (
                  <button className="ghost-button" type="button" onClick={() => setStudentForm(defaultStudentForm)}>
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
          </Panel>

          <Panel title="Student List">
            <DataTable
              columns={["Name", "Roll", "Section", "Email", "Actions"]}
              rows={students.map((student) => [
                student.user?.name,
                student.rollNumber,
                `${student.department?.code} / Sem ${student.semester} / ${student.section?.name}`,
                student.user?.email,
                <div className="table-actions" key={`${student._id}-actions`}>
                  <button
                    className="link-button"
                    onClick={() => {
                      setActiveNav("students");
                      setStudentForm({
                        editingId: student._id,
                        name: student.user?.name || "",
                        email: student.user?.email || "",
                        password: "",
                        rollNumber: student.rollNumber,
                        departmentId: student.department?._id || "",
                        semester: String(student.semester),
                        sectionId: student.section?._id || ""
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button className="link-button danger" onClick={() => handleDeleteStudent(student._id)}>
                    Delete
                  </button>
                </div>
              ])}
            />
          </Panel>
        </div>
      ) : null}

      {activeNav === "teachers" ? (
        <div className="dashboard-grid two-column">
          <Panel title={teacherForm.editingId ? "Edit Teacher" : "Teacher Account"}>
            <form className="stack-form compact" onSubmit={submitTeacher}>
              <label>
                <span>Name</span>
                <input
                  value={teacherForm.name}
                  onChange={(event) => setTeacherForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={teacherForm.email}
                  onChange={(event) => setTeacherForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Password {teacherForm.editingId ? "(leave blank to keep current)" : "(optional)"}</span>
                <input
                  type="password"
                  value={teacherForm.password}
                  onChange={(event) => setTeacherForm((current) => ({ ...current, password: event.target.value }))}
                />
              </label>
              <label>
                <span>Teacher ID</span>
                <input
                  value={teacherForm.teacherCode}
                  onChange={(event) => setTeacherForm((current) => ({ ...current, teacherCode: event.target.value }))}
                  required
                />
              </label>
              <label>
                <span>Department</span>
                <select
                  value={teacherForm.departmentId}
                  onChange={(event) => setTeacherForm((current) => ({ ...current, departmentId: event.target.value }))}
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department._id} value={department._id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="button-row">
                <button className="primary-button" type="submit" disabled={busyKey === "teacher"}>
                  {busyKey === "teacher"
                    ? "Saving..."
                    : teacherForm.editingId
                      ? "Update Teacher"
                      : "Create Teacher"}
                </button>
                {teacherForm.editingId ? (
                  <button className="ghost-button" type="button" onClick={() => setTeacherForm(defaultTeacherForm)}>
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
          </Panel>

          <Panel title="Teacher List">
            <DataTable
              columns={["Name", "Teacher ID", "Department", "Email", "Actions"]}
              rows={teachers.map((teacher) => [
                teacher.user?.name,
                teacher.teacherId,
                teacher.department?.name,
                teacher.user?.email,
                <div className="table-actions" key={`${teacher._id}-actions`}>
                  <button
                    className="link-button"
                    onClick={() => {
                      setActiveNav("teachers");
                      setTeacherForm({
                        editingId: teacher._id,
                        name: teacher.user?.name || "",
                        email: teacher.user?.email || "",
                        password: "",
                        teacherCode: teacher.teacherId,
                        departmentId: teacher.department?._id || ""
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button className="link-button danger" onClick={() => handleDeleteTeacher(teacher._id)}>
                    Delete
                  </button>
                </div>
              ])}
            />
          </Panel>
        </div>
      ) : null}

      {activeNav === "assignments" ? (
        <div className="dashboard-grid two-column">
          <Panel title="Teacher Assignment">
            <form className="stack-form compact" onSubmit={submitAssignment}>
              <label>
                <span>Teacher</span>
                <select
                  value={academicForms.assignment.teacherId}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      assignment: { ...current.assignment, teacherId: event.target.value }
                    }))
                  }
                  required
                >
                  <option value="">Select teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.user?.name} ({teacher.teacherId})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Subject</span>
                <select
                  value={academicForms.assignment.subjectId}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      assignment: { ...current.assignment, subjectId: event.target.value }
                    }))
                  }
                  required
                >
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Section</span>
                <select
                  value={academicForms.assignment.sectionId}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      assignment: { ...current.assignment, sectionId: event.target.value }
                    }))
                  }
                  required
                >
                  <option value="">Select section</option>
                  {sections.map((section) => (
                    <option key={section._id} value={section._id}>
                      {section.department?.code} / Sem {section.semester} / {section.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="secondary-button" type="submit" disabled={busyKey === "assignment"}>
                {busyKey === "assignment" ? "Saving..." : "Assign Teacher"}
              </button>
            </form>
          </Panel>

          <Panel title="Assignment List">
            <DataTable
              columns={["Teacher", "Subject", "Section", "Actions"]}
              rows={assignments.map((assignment) => [
                assignment.teacher?.user?.name || "-",
                assignment.subject?.name || "-",
                assignment.section ? `Sem ${assignment.section.semester} / ${assignment.section.name}` : "-",
                <div className="table-actions" key={`${assignment._id}-actions`}>
                  <button className="link-button danger" onClick={() => handleDeleteAssignment(assignment._id)}>
                    Delete
                  </button>
                </div>
              ])}
            />
          </Panel>
        </div>
      ) : null}

      {activeNav === "timetable" ? (
        <div className="dashboard-grid two-column">
          <Panel title="Timetable Entry">
            <form className="stack-form compact" onSubmit={submitTimetable}>
              <label>
                <span>Teacher</span>
                <select
                  value={academicForms.timetable.teacherId}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      timetable: { ...current.timetable, teacherId: event.target.value }
                    }))
                  }
                  required
                >
                  <option value="">Select teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.user?.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Subject</span>
                <select
                  value={academicForms.timetable.subjectId}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      timetable: { ...current.timetable, subjectId: event.target.value }
                    }))
                  }
                  required
                >
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Section</span>
                <select
                  value={academicForms.timetable.sectionId}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      timetable: { ...current.timetable, sectionId: event.target.value }
                    }))
                  }
                  required
                >
                  <option value="">Select section</option>
                  {sections.map((section) => (
                    <option key={section._id} value={section._id}>
                      {section.department?.code} / Sem {section.semester} / {section.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Day</span>
                <select
                  value={academicForms.timetable.dayOfWeek}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      timetable: { ...current.timetable, dayOfWeek: event.target.value }
                    }))
                  }
                  required
                >
                  {DAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Start Time</span>
                <input
                  type="time"
                  value={academicForms.timetable.startTime}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      timetable: { ...current.timetable, startTime: event.target.value }
                    }))
                  }
                  required
                />
              </label>
              <label>
                <span>End Time</span>
                <input
                  type="time"
                  value={academicForms.timetable.endTime}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      timetable: { ...current.timetable, endTime: event.target.value }
                    }))
                  }
                  required
                />
              </label>
              <label>
                <span>Room</span>
                <input
                  value={academicForms.timetable.room}
                  onChange={(event) =>
                    setAcademicForms((current) => ({
                      ...current,
                      timetable: { ...current.timetable, room: event.target.value }
                    }))
                  }
                />
              </label>
              <button className="secondary-button" type="submit" disabled={busyKey === "timetable"}>
                {busyKey === "timetable" ? "Saving..." : "Create Timetable"}
              </button>
            </form>
          </Panel>

          <Panel title="Timetable List">
            <DataTable
              columns={["Day", "Time", "Teacher", "Subject", "Section", "Actions"]}
              rows={timetables.map((entry) => [
                entry.dayOfWeek,
                `${entry.startTime} - ${entry.endTime}`,
                entry.teacher?.user?.name || "-",
                entry.subject?.name || "-",
                entry.section ? `Sem ${entry.section.semester} / ${entry.section.name}` : "-",
                <div className="table-actions" key={`${entry._id}-actions`}>
                  <button className="link-button danger" onClick={() => handleDeleteTimetable(entry._id)}>
                    Delete
                  </button>
                </div>
              ])}
            />
          </Panel>
        </div>
      ) : null}

      {activeNav === "reports" ? (
        <Panel title="Excel Report">
          <div className="inline-form">
            <label>
              <span>Date</span>
              <input
                type="date"
                value={reportFilters.date}
                onChange={(event) =>
                  setReportFilters((current) => ({ ...current, date: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Section</span>
              <select
                value={reportFilters.sectionId}
                onChange={(event) =>
                  setReportFilters((current) => ({ ...current, sectionId: event.target.value }))
                }
              >
                <option value="">All sections</option>
                {sections.map((section) => (
                  <option key={section._id} value={section._id}>
                    {section.department?.code} / Sem {section.semester} / {section.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Subject</span>
              <select
                value={reportFilters.subjectId}
                onChange={(event) =>
                  setReportFilters((current) => ({ ...current, subjectId: event.target.value }))
                }
              >
                <option value="">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="button" onClick={handleExportReport} disabled={busyKey === "export"}>
              {busyKey === "export" ? "Preparing..." : "Download Excel"}
            </button>
          </div>
        </Panel>
      ) : null}
    </DashboardShell>
  );
}

function TeacherDashboard({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState("overview");
  const [dashboard, setDashboard] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [sessionAttendance, setSessionAttendance] = useState(null);
  const [qrState, setQrState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadDashboard = useCallback(async () => {
    const { data } = await api.get("/teacher/dashboard");
    setDashboard(data);
  }, []);

  const loadSessionBundle = useCallback(async (sessionId) => {
    const [attendanceResponse, qrResponse] = await Promise.all([
      api.get(`/teacher/sessions/${sessionId}/attendance`),
      api.get(`/teacher/sessions/${sessionId}/qr`)
    ]);

    setSessionAttendance(attendanceResponse.data);
    setQrState(qrResponse.data);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);

      try {
        await loadDashboard();
        setError("");
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [loadDashboard]);

  useEffect(() => {
    const firstActiveSession = dashboard?.todayClasses?.find((entry) => entry.currentSession)?.currentSession?._id;

    if (!selectedSessionId && firstActiveSession) {
      setSelectedSessionId(firstActiveSession);
    }
  }, [dashboard, selectedSessionId]);

  useEffect(() => {
    if (!selectedSessionId) {
      setSessionAttendance(null);
      setQrState(null);
      return;
    }

    loadSessionBundle(selectedSessionId).catch((requestError) => {
      setError(getErrorMessage(requestError));
    });
  }, [loadSessionBundle, selectedSessionId]);

  useEffect(() => {
    if (!selectedSessionId) {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      try {
        await loadSessionBundle(selectedSessionId);
      } catch {
        // silent polling refresh
      }
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [loadSessionBundle, selectedSessionId]);

  useEffect(() => {
    const intervalId = window.setInterval(async () => {
      try {
        await loadDashboard();
      } catch {
        // silent dashboard refresh
      }
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [loadDashboard]);

  const startAttendanceSession = async (timetableId) => {
    setError("");
    setFeedback("");

    try {
      const { data } = await api.post(`/teacher/sessions/start/${timetableId}`);
      setSelectedSessionId(data.session._id);
      setActiveNav("qr");
      await loadDashboard();
      setFeedback("Attendance session started");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const openAttendanceSession = (sessionId, nextNav = "attendance") => {
    setSelectedSessionId(sessionId);
    setActiveNav(nextNav);
    setError("");
    setFeedback("");
  };

  const completeSession = async () => {
    if (!selectedSessionId) {
      return;
    }

    try {
      await api.post(`/teacher/sessions/end/${selectedSessionId}`);
      await Promise.all([loadDashboard(), loadSessionBundle(selectedSessionId)]);
      setFeedback("Session closed and absences finalized");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const decideLateRequest = async (attendanceId, decision) => {
    try {
      await api.post(`/teacher/late-requests/${attendanceId}/decision`, { decision });
      await Promise.all([loadDashboard(), loadSessionBundle(selectedSessionId)]);
      setFeedback(`Late request ${decision}d`);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  if (loading) {
    return <SplashScreen label="Loading teacher dashboard..." />;
  }

  const todayClasses = dashboard?.todayClasses || [];
  const selectedSession =
    qrState?.session ||
    sessionAttendance?.session ||
    todayClasses.find((entry) => entry.currentSession?._id === selectedSessionId)?.currentSession ||
    null;

  return (
    <DashboardShell
      title="Teacher Dashboard"
      subtitle="Start today's timetable sessions, show the live QR, and review late attendance requests."
      user={user}
      onLogout={onLogout}
      navItems={TEACHER_NAV_ITEMS}
      activeNav={activeNav}
      onChangeNav={setActiveNav}
    >
      {feedback ? <div className="feedback success">{feedback}</div> : null}
      {error ? <div className="feedback error">{error}</div> : null}

      {activeNav === "overview" ? (
        <div className="stack-panel">
          <div className="stats-grid three">
            <StatCard label="Today's Classes" value={dashboard?.metrics.todaysClasses || 0} />
            <StatCard label="Started Sessions" value={dashboard?.metrics.todaysSessions || 0} />
            <StatCard label="Late Requests" value={dashboard?.metrics.pendingLateRequests || 0} />
          </div>

          <Panel title="Today's Timetable">
            <TeacherScheduleList
              entries={todayClasses}
              onStart={startAttendanceSession}
              onOpenQr={(sessionId) => openAttendanceSession(sessionId, "qr")}
              onOpenAttendance={(sessionId) => openAttendanceSession(sessionId, "attendance")}
              emptyMessage="No timetable entries match today."
            />
          </Panel>
        </div>
      ) : null}

      {activeNav === "classes" ? (
        <Panel title="Today's Classes">
          <TeacherScheduleList
            entries={todayClasses}
            onStart={startAttendanceSession}
            onOpenQr={(sessionId) => openAttendanceSession(sessionId, "qr")}
            onOpenAttendance={(sessionId) => openAttendanceSession(sessionId, "attendance")}
            emptyMessage="No timetable entries match today."
          />
        </Panel>
      ) : null}

      {activeNav === "qr" ? (
        <div className="dashboard-grid two-column">
          <Panel
            title="Live QR"
            actions={
              selectedSessionId ? (
                <div className="button-row">
                  <button className="ghost-button" type="button" onClick={() => loadSessionBundle(selectedSessionId)}>
                    Refresh
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setActiveNav("attendance")}>
                    Attendance
                  </button>
                  {qrState?.session?.status === "active" ? (
                    <button className="danger-button" type="button" onClick={completeSession}>
                      End Session
                    </button>
                  ) : null}
                </div>
              ) : null
            }
          >
            {selectedSessionId && qrState ? (
              <div className="qr-panel">
                <div className="session-title">{qrState.session?.subject?.name || "Selected Session"}</div>
                <div className="session-subtitle">
                  Section {qrState.session?.section?.name || "-"} - Status {formatStatus(qrState.session?.status || "ended")}
                </div>
                {qrState.qr?.qrDataUrl ? (
                  <img className="qr-image" src={qrState.qr.qrDataUrl} alt="Attendance QR code" />
                ) : (
                  <div className="empty-state">This session is closed. No live QR is available.</div>
                )}
                <div className="session-meta">Token expires: {formatDateTime(qrState.qr?.expiresAt)}</div>
              </div>
            ) : (
              <div className="empty-state">Choose a started class to display the live QR.</div>
            )}
          </Panel>

          <Panel title="Available Sessions">
            <TeacherScheduleList
              entries={todayClasses}
              onStart={startAttendanceSession}
              onOpenQr={(sessionId) => openAttendanceSession(sessionId, "qr")}
              onOpenAttendance={(sessionId) => openAttendanceSession(sessionId, "attendance")}
              emptyMessage="No timetable entries match today."
            />
          </Panel>
        </div>
      ) : null}

      {activeNav === "attendance" ? (
        <div className="dashboard-grid two-column">
          <Panel title="Attendance Sessions">
            <TeacherScheduleList
              entries={todayClasses}
              onStart={startAttendanceSession}
              onOpenQr={(sessionId) => openAttendanceSession(sessionId, "qr")}
              onOpenAttendance={(sessionId) => openAttendanceSession(sessionId, "attendance")}
              emptyMessage="No timetable entries match today."
            />
          </Panel>

          <Panel title="Attendance Roster">
            {sessionAttendance ? (
              <>
                <div className="stats-grid compact-grid">
                  <StatCard label="Present" value={sessionAttendance.summary.present} />
                  <StatCard label="Absent" value={sessionAttendance.summary.absent} />
                  <StatCard label="Late Pending" value={sessionAttendance.summary.latePending} />
                </div>
                <DataTable
                  columns={["Student", "Roll", "Status", "Scanned", "Late Reason", "Action"]}
                  rows={sessionAttendance.roster.map((entry) => [
                    entry.studentName,
                    entry.rollNumber,
                    <StatusBadge key={`${entry.studentId}-status`} status={entry.status} />,
                    formatDateTime(entry.scanTime),
                    entry.lateReason || "-",
                    entry.status === "late_pending" ? (
                      <div className="table-actions" key={`${entry.studentId}-actions`}>
                        <button
                          className="link-button"
                          onClick={() => decideLateRequest(entry.attendanceId, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="link-button danger"
                          onClick={() => decideLateRequest(entry.attendanceId, "decline")}
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      "-"
                    )
                  ])}
                />
              </>
            ) : (
              <div className="empty-state">Choose a session to review attendance.</div>
            )}
          </Panel>
        </div>
      ) : null}
    </DashboardShell>
  );

  return (
    <DashboardShell
      title="Teacher Dashboard"
      subtitle="Start today's timetable sessions, show the live QR, and review late attendance requests."
      user={user}
      onLogout={onLogout}
    >
      {feedback ? <div className="feedback success">{feedback}</div> : null}
      {error ? <div className="feedback error">{error}</div> : null}

      <div className="stats-grid three">
        <StatCard label="Today's Classes" value={dashboard?.metrics.todaysClasses || 0} />
        <StatCard label="Started Sessions" value={dashboard?.metrics.todaysSessions || 0} />
        <StatCard label="Late Requests" value={dashboard?.metrics.pendingLateRequests || 0} />
      </div>

      <Panel title="Today's Timetable">
        <div className="card-list">
          {(dashboard?.todayClasses || []).map((entry) => (
            <article className="session-card" key={entry._id}>
              <div>
                <div className="session-title">{entry.subject?.name}</div>
                <div className="session-subtitle">
                  {entry.subject?.code} • Sem {entry.section?.semester} • Section {entry.section?.name}
                </div>
                <div className="session-meta">
                  {entry.startTime} - {entry.endTime}
                  {entry.room ? ` • Room ${entry.room}` : ""}
                </div>
              </div>
              <div className="button-row">
                {entry.currentSession ? (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => openAttendanceSession(entry.currentSession._id)}
                  >
                    View Session
                  </button>
                ) : (
                  <button className="primary-button" type="button" onClick={() => startAttendanceSession(entry._id)}>
                    Start Session
                  </button>
                )}
              </div>
            </article>
          ))}

          {!dashboard?.todayClasses?.length ? (
            <div className="empty-state">No timetable entries match today.</div>
          ) : null}
        </div>
      </Panel>

      <div className="dashboard-grid two-column">
        <Panel
          title="Live QR"
          actions={
            selectedSessionId ? (
              <div className="button-row">
                <button className="ghost-button" type="button" onClick={() => loadSessionBundle(selectedSessionId)}>
                  Refresh
                </button>
                {qrState?.session?.status === "active" ? (
                  <button className="danger-button" type="button" onClick={completeSession}>
                    End Session
                  </button>
                ) : null}
              </div>
            ) : null
          }
        >
          {selectedSessionId && qrState ? (
            <div className="qr-panel">
              <div className="session-subtitle">
                {qrState.session?.subject?.name} • Section {qrState.session?.section?.name}
              </div>
              {qrState.qr?.qrDataUrl ? (
                <img className="qr-image" src={qrState.qr.qrDataUrl} alt="Attendance QR code" />
              ) : (
                <div className="empty-state">This session is closed. No live QR is available.</div>
              )}
              <div className="session-meta">
                Status: <strong>{formatStatus(qrState.session?.status || "ended")}</strong>
              </div>
              <div className="session-meta">
                Token expires: {formatDateTime(qrState.qr?.expiresAt)}
              </div>
            </div>
          ) : (
            <div className="empty-state">Start or open a session to display the live QR.</div>
          )}
        </Panel>

        <Panel title="Attendance Roster">
          {sessionAttendance ? (
            <>
              <div className="stats-grid compact-grid">
                <StatCard label="Present" value={sessionAttendance.summary.present} />
                <StatCard label="Absent" value={sessionAttendance.summary.absent} />
                <StatCard label="Late Pending" value={sessionAttendance.summary.latePending} />
              </div>
              <DataTable
                columns={["Student", "Roll", "Status", "Scanned", "Late Reason", "Action"]}
                rows={sessionAttendance.roster.map((entry) => [
                  entry.studentName,
                  entry.rollNumber,
                  <StatusBadge key={`${entry.studentId}-status`} status={entry.status} />,
                  formatDateTime(entry.scanTime),
                  entry.lateReason || "-",
                  entry.status === "late_pending" ? (
                    <div className="table-actions" key={`${entry.studentId}-actions`}>
                      <button
                        className="link-button"
                        onClick={() => decideLateRequest(entry.attendanceId, "approve")}
                      >
                        Approve
                      </button>
                      <button
                        className="link-button danger"
                        onClick={() => decideLateRequest(entry.attendanceId, "decline")}
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    "—"
                  )
                ])}
              />
            </>
          ) : (
            <div className="empty-state">Choose a session to review attendance.</div>
          )}
        </Panel>
      </div>
    </DashboardShell>
  );
}

function StudentDashboard({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState("overview");
  const [dashboard, setDashboard] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [manualQrText, setManualQrText] = useState("");
  const [latePrompt, setLatePrompt] = useState(null);
  const [scannerEnabled, setScannerEnabled] = useState(false);
  const [imageScanBusy, setImageScanBusy] = useState(false);
  const processingScanRef = useRef(false);

  const loadStudentData = useCallback(async () => {
    const [dashboardResponse, historyResponse] = await Promise.all([
      api.get("/student/dashboard"),
      api.get("/student/history")
    ]);

    setDashboard(dashboardResponse.data);
    setHistory(historyResponse.data.history);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);

      try {
        await loadStudentData();
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [loadStudentData]);

  useEffect(() => {
    if (activeNav !== "scan") {
      setScannerEnabled(false);
    }
  }, [activeNav]);

  const submitAttendanceToken = useCallback(
    async (payload, reason = "") => {
      setError("");
      setFeedback("");

      try {
        const { data } = await api.post("/student/scan", {
          sessionId: payload.sessionId,
          token: payload.token,
          lateReason: reason
        });

        setFeedback(data.message);
        setLatePrompt(null);
        setManualQrText("");
        await loadStudentData();
      } catch (requestError) {
        if (requestError?.response?.data?.requiresReason) {
          setLatePrompt({ payload, reason: "" });
        } else {
          setError(getErrorMessage(requestError));
        }
      }
    },
    [loadStudentData]
  );

  const handleDecodedPayload = useCallback(
    async (decodedText) => {
      if (processingScanRef.current) {
        return;
      }

      processingScanRef.current = true;

      try {
        const payload = JSON.parse(decodedText);

        if (!payload.sessionId || !payload.token) {
          throw new Error("Invalid QR content");
        }

        await submitAttendanceToken(payload);
      } catch (decodeError) {
        setError(decodeError.message || "Invalid QR code");
      } finally {
        window.setTimeout(() => {
          processingScanRef.current = false;
        }, 1500);
      }
    },
    [submitAttendanceToken]
  );

  const handleManualSubmit = async () => {
    try {
      const payload = JSON.parse(manualQrText);
      await submitAttendanceToken(payload);
    } catch {
      setError("Paste a valid QR payload JSON");
    }
  };

  const handleImageFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const tempReaderId = "student-qr-image-reader";
    setError("");
    setFeedback("");
    setImageScanBusy(true);

    try {
      const qrFromImage = new Html5Qrcode(tempReaderId, false);
      const decodedText = await qrFromImage.scanFile(file, false);
      await qrFromImage.clear().catch(() => {});
      await handleDecodedPayload(decodedText);
    } catch (scanError) {
      setError(scanError.message || "Could not read a QR code from that image");
    } finally {
      event.target.value = "";
      setImageScanBusy(false);
    }
  };

  if (loading) {
    return <SplashScreen label="Loading student dashboard..." />;
  }

  return (
    <DashboardShell
      title="Student Dashboard"
      subtitle="Scan the live QR, view your attendance percentage, and keep track of late requests."
      user={user}
      onLogout={onLogout}
      navItems={STUDENT_NAV_ITEMS}
      activeNav={activeNav}
      onChangeNav={setActiveNav}
    >
      {feedback ? <div className="feedback success">{feedback}</div> : null}
      {error ? <div className="feedback error">{error}</div> : null}

      {activeNav === "overview" ? (
        <div className="stack-panel">
          <div className="stats-grid four">
            <StatCard label="Attendance %" value={`${dashboard?.metrics.percentage || 0}%`} />
            <StatCard label="Attended" value={dashboard?.metrics.attendedClasses || 0} />
            <StatCard label="Absent" value={dashboard?.metrics.absentClasses || 0} />
            <StatCard label="Late Pending" value={dashboard?.metrics.pendingLate || 0} />
          </div>

          <div className="dashboard-grid two-column">
            <Panel title="Attendance by Subject">
              <DataTable
                columns={["Subject", "Code", "Classes", "Attended", "Pending Late", "Attendance %"]}
                rows={(dashboard?.subjectStats || []).map((subject) => [
                  subject.subjectName,
                  subject.subjectCode,
                  subject.totalClasses,
                  subject.attendedClasses,
                  subject.pendingLate,
                  `${subject.percentage}%`
                ])}
              />
            </Panel>

            <Panel title="Recent Attendance">
              <DataTable
                columns={["Date", "Subject", "Status", "Scanned At"]}
                rows={(dashboard?.recentAttendance || []).map((entry) => [
                  entry.sessionDate || "-",
                  `${entry.subjectName} (${entry.subjectCode})`,
                  <StatusBadge key={`${entry._id}-status`} status={entry.status} />,
                  formatDateTime(entry.scanTime)
                ])}
              />
            </Panel>
          </div>
        </div>
      ) : null}

      {activeNav === "scan" ? (
        <Panel title="QR Scan">
          <div className="scanner-block">
            {!scannerEnabled ? (
              <div className="scanner-placeholder">
                <button className="primary-button" type="button" onClick={() => setScannerEnabled(true)}>
                  Start Camera
                </button>
              </div>
            ) : (
              <QrScanner onScan={handleDecodedPayload} />
            )}

            <label className="file-picker">
              <span>{imageScanBusy ? "Reading Image..." : "Add Image From Phone"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                disabled={imageScanBusy}
              />
            </label>

            <label>
              <span>Manual QR payload fallback</span>
              <textarea
                rows="5"
                value={manualQrText}
                onChange={(event) => setManualQrText(event.target.value)}
                placeholder='{"type":"attendance_session","sessionId":"...","token":"..."}'
              />
            </label>
            <button className="secondary-button" type="button" onClick={handleManualSubmit}>
              Submit Manual Payload
            </button>
          </div>
        </Panel>
      ) : null}

      {activeNav === "history" ? (
        <Panel title="Attendance History">
          <DataTable
            columns={["Date", "Subject", "Status", "Scanned At", "Late Reason"]}
            rows={history.map((entry) => [
              entry.sessionDate,
              `${entry.subjectName} (${entry.subjectCode})`,
              <StatusBadge key={`${entry._id}-status`} status={entry.status} />,
              formatDateTime(entry.scanTime),
              entry.lateReason || "-"
            ])}
          />
        </Panel>
      ) : null}

      {latePrompt ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>You are more than 15 minutes late</h3>
            <p>Submit a reason so your teacher can approve or decline your attendance request.</p>
            <textarea
              rows="5"
              value={latePrompt.reason}
              onChange={(event) =>
                setLatePrompt((current) => ({
                  ...current,
                  reason: event.target.value
                }))
              }
              placeholder="Write your reason for being late..."
            />
            <div className="button-row">
              <button
                className="primary-button"
                type="button"
                onClick={() => submitAttendanceToken(latePrompt.payload, latePrompt.reason)}
              >
                Submit Request
              </button>
              <button className="ghost-button" type="button" onClick={() => setLatePrompt(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div id="student-qr-image-reader" className="scanner-hidden" />
    </DashboardShell>
  );

  return (
    <DashboardShell
      title="Student Dashboard"
      subtitle="Scan the live QR, view your attendance percentage, and keep track of late requests."
      user={user}
      onLogout={onLogout}
    >
      {feedback ? <div className="feedback success">{feedback}</div> : null}
      {error ? <div className="feedback error">{error}</div> : null}

      <div className="stats-grid four">
        <StatCard label="Attendance %" value={`${dashboard?.metrics.percentage || 0}%`} />
        <StatCard label="Attended" value={dashboard?.metrics.attendedClasses || 0} />
        <StatCard label="Absent" value={dashboard?.metrics.absentClasses || 0} />
        <StatCard label="Late Pending" value={dashboard?.metrics.pendingLate || 0} />
      </div>

      <div className="dashboard-grid two-column">
        <Panel title="QR Scan">
          <div className="scanner-block">
            <QrScanner onScan={handleDecodedPayload} />
            <label>
              <span>Manual QR payload fallback</span>
              <textarea
                rows="5"
                value={manualQrText}
                onChange={(event) => setManualQrText(event.target.value)}
                placeholder='{"type":"attendance_session","sessionId":"...","token":"..."}'
              />
            </label>
            <button className="secondary-button" type="button" onClick={handleManualSubmit}>
              Submit Manual Payload
            </button>
          </div>
        </Panel>

        <Panel title="Attendance by Subject">
          <DataTable
            columns={["Subject", "Code", "Classes", "Attended", "Pending Late", "Attendance %"]}
            rows={(dashboard?.subjectStats || []).map((subject) => [
              subject.subjectName,
              subject.subjectCode,
              subject.totalClasses,
              subject.attendedClasses,
              subject.pendingLate,
              `${subject.percentage}%`
            ])}
          />
        </Panel>
      </div>

      <Panel title="Attendance History">
        <DataTable
          columns={["Date", "Subject", "Status", "Scanned At", "Late Reason"]}
          rows={history.map((entry) => [
            entry.sessionDate,
            `${entry.subjectName} (${entry.subjectCode})`,
            <StatusBadge key={`${entry._id}-status`} status={entry.status} />,
            formatDateTime(entry.scanTime),
            entry.lateReason || "-"
          ])}
        />
      </Panel>

      {latePrompt ? (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>You are more than 15 minutes late</h3>
            <p>Submit a reason so your teacher can approve or decline your attendance request.</p>
            <textarea
              rows="5"
              value={latePrompt.reason}
              onChange={(event) =>
                setLatePrompt((current) => ({
                  ...current,
                  reason: event.target.value
                }))
              }
              placeholder="Write your reason for being late..."
            />
            <div className="button-row">
              <button
                className="primary-button"
                type="button"
                onClick={() => submitAttendanceToken(latePrompt.payload, latePrompt.reason)}
              >
                Submit Request
              </button>
              <button className="ghost-button" type="button" onClick={() => setLatePrompt(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}

function QrScanner({ onScan }) {
  const scannerContainerId = "student-qr-reader";
  const scannerRef = useRef(null);
  const startedRef = useRef(false);
  const [scannerError, setScannerError] = useState("");
  const [scannerState, setScannerState] = useState("starting");

  useEffect(() => {
    let isMounted = true;
    const html5QrCode = new Html5Qrcode(scannerContainerId);
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();

        if (!cameras.length) {
          throw new Error("No camera detected. Use the manual QR payload fallback below.");
        }

        const preferredCamera =
          cameras.find((camera) => /(back|rear|environment)/i.test(camera.label || "")) || cameras[0];

        await html5QrCode.start(
          preferredCamera.id,
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1,
            disableFlip: false
          },
          async (decodedText) => {
            if (isMounted) {
              await onScan(decodedText);
            }
          },
          () => {}
        );

        startedRef.current = true;
        if (isMounted) {
          setScannerState("ready");
        }
      } catch (error) {
        if (isMounted) {
          setScannerState("error");
          setScannerError(error.message || "Unable to start the camera scanner");
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;

      if (startedRef.current && scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current?.clear().catch(() => {});
          });
      } else {
        scannerRef.current?.clear().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="scanner-card">
      <div id={scannerContainerId} className="scanner-view" />
      {scannerState === "starting" ? <div className="scanner-status">Starting camera...</div> : null}
      {scannerError ? <div className="feedback error">{scannerError}</div> : null}
    </div>
  );
}

function DashboardShell({ title, subtitle, user, onLogout, navItems = [], activeNav = "", onChangeNav, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-tag">Smart Attendance</div>
          <h1>{title}</h1>

          {navItems.length ? (
            <nav className="sidebar-nav">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`nav-button ${activeNav === item.id ? "active" : ""}`}
                  type="button"
                  onClick={() => onChangeNav?.(item.id)}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          ) : null}
        </div>

        <div className="profile-card">
          <div className="profile-role">{user.role}</div>
          <div className="profile-name">{user.name}</div>
          <div className="profile-email">{user.email}</div>
          <button className="ghost-button" type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="content-shell">{children}</main>
    </div>
  );
}

function TeacherScheduleList({ entries, onStart, onOpenQr, onOpenAttendance, emptyMessage }) {
  if (!entries.length) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <div className="card-list">
      {entries.map((entry) => (
        <article className="session-card" key={entry._id}>
          <div>
            <div className="session-title">{entry.subject?.name}</div>
            <div className="session-subtitle">
              {entry.subject?.code} - Sem {entry.section?.semester} - Section {entry.section?.name}
            </div>
            <div className="session-meta">
              {entry.startTime} - {entry.endTime}
              {entry.room ? ` - Room ${entry.room}` : ""}
            </div>
          </div>

          <div className="button-row">
            {entry.currentSession ? (
              <>
                <button className="secondary-button" type="button" onClick={() => onOpenQr(entry.currentSession._id)}>
                  Open QR
                </button>
                <button className="ghost-button" type="button" onClick={() => onOpenAttendance(entry.currentSession._id)}>
                  Attendance
                </button>
              </>
            ) : (
              <button className="primary-button" type="button" onClick={() => onStart(entry._id)}>
                Start Session
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function InfoTile({ title, text }) {
  return (
    <article className="info-tile">
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function Panel({ title, actions, children }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

function DataTable({ columns, rows }) {
  if (!rows.length) {
    return <div className="empty-state">No data available yet.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`status-badge ${status}`}>{formatStatus(status)}</span>;
}

export default App;
