import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import XLSX from "xlsx";
import {
  Attendance,
  Department,
  Section,
  Session,
  StudentProfile,
  Subject,
  TeacherAssignment,
  TeacherProfile,
  Timetable,
  User
} from "./models.js";
import {
  combineDateAndTime,
  ensureSessionIsCurrent,
  finalizeSession,
  getTodayDateString,
  getTodayWeekday,
  isAttendanceCountedAsPresent,
  refreshQrForSession
} from "./services.js";

export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const notFound = (message) => {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
};

const conflict = (message, extra = {}) => {
  const error = new Error(message);
  error.statusCode = 409;
  Object.assign(error, extra);
  return error;
};

const signToken = (user) =>
  jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });

const createPasswordHash = (password) => bcrypt.hash(password, 10);

const loadProfileForUser = async (user) => {
  if (user.role === "student") {
    return StudentProfile.findOne({ user: user._id })
      .populate("department", "name code")
      .populate("section", "name semester");
  }

  if (user.role === "teacher") {
    return TeacherProfile.findOne({ user: user._id }).populate("department", "name code");
  }

  return null;
};

const mapUserResponse = (user, profile = null) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profile
});

const getTeacherProfileByUser = async (userId) => {
  const profile = await TeacherProfile.findOne({ user: userId });
  if (!profile) {
    throw notFound("Teacher profile not found");
  }
  return profile;
};

const getStudentProfileByUser = async (userId) => {
  const profile = await StudentProfile.findOne({ user: userId })
    .populate("department", "name code")
    .populate("section", "name semester");
  if (!profile) {
    throw notFound("Student profile not found");
  }
  return profile;
};

const ensureSectionAndDepartment = async ({ departmentId, sectionId, semester }) => {
  const [department, section] = await Promise.all([
    Department.findById(departmentId),
    Section.findById(sectionId)
  ]);

  if (!department) {
    throw badRequest("Department not found");
  }

  if (!section) {
    throw badRequest("Section not found");
  }

  if (section.department.toString() !== department._id.toString() || section.semester !== Number(semester)) {
    throw badRequest("Section does not match the selected department and semester");
  }
};

const attendanceSummaryFromRoster = (roster) =>
  roster.reduce(
    (summary, item) => {
      if (item.status === "late_pending") {
        summary.latePending += 1;
      } else if (item.status === "late_approved") {
        summary.present += 1;
        summary.lateApproved += 1;
      } else if (item.status === "late_rejected") {
        summary.absent += 1;
        summary.lateRejected += 1;
      } else if (item.status === "present") {
        summary.present += 1;
      } else {
        summary.absent += 1;
      }

      return summary;
    },
    { present: 0, absent: 0, latePending: 0, lateApproved: 0, lateRejected: 0 }
  );

const loadAdminBootstrap = async () => {
  const [departments, sections, subjects, students, teachers, assignments, timetables] = await Promise.all([
    Department.find().sort({ name: 1 }).lean(),
    Section.find().populate("department", "name code").sort({ semester: 1, name: 1 }).lean(),
    Subject.find().populate("department", "name code").sort({ semester: 1, name: 1 }).lean(),
    StudentProfile.find()
      .populate("user", "name email role")
      .populate("department", "name code")
      .populate("section", "name semester")
      .sort({ rollNumber: 1 })
      .lean(),
    TeacherProfile.find()
      .populate("user", "name email role")
      .populate("department", "name code")
      .sort({ teacherId: 1 })
      .lean(),
    TeacherAssignment.find()
      .populate({
        path: "teacher",
        populate: { path: "user", select: "name email" }
      })
      .populate("subject", "name code semester")
      .populate("section", "name semester")
      .sort({ createdAt: -1 })
      .lean(),
    Timetable.find()
      .populate({
        path: "teacher",
        populate: { path: "user", select: "name email" }
      })
      .populate("subject", "name code semester")
      .populate("section", "name semester")
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean()
  ]);

  return {
    departments,
    sections,
    subjects,
    students,
    teachers,
    assignments,
    timetables
  };
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw badRequest("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");

  if (!user || !user.isActive) {
    throw badRequest("Invalid credentials");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw badRequest("Invalid credentials");
  }

  const profile = await loadProfileForUser(user);
  const token = signToken(user);

  res.json({
    token,
    user: mapUserResponse(user, profile)
  });
};

export const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user._id);
  const profile = await loadProfileForUser(user);

  res.json({
    user: mapUserResponse(user, profile)
  });
};

export const getAdminDashboard = async (_req, res) => {
  const [studentCount, teacherCount, departmentCount, subjectCount, sectionCount, pendingLateCount, todaySessions] =
    await Promise.all([
      StudentProfile.countDocuments(),
      TeacherProfile.countDocuments(),
      Department.countDocuments(),
      Subject.countDocuments(),
      Section.countDocuments(),
      Attendance.countDocuments({ status: "late_pending" }),
      Session.countDocuments({ sessionDate: getTodayDateString() })
    ]);

  res.json({
    metrics: {
      students: studentCount,
      teachers: teacherCount,
      departments: departmentCount,
      subjects: subjectCount,
      sections: sectionCount,
      pendingLateRequests: pendingLateCount,
      todaysSessions: todaySessions
    }
  });
};

export const getAdminBootstrap = async (_req, res) => {
  res.json(await loadAdminBootstrap());
};

export const createDepartment = async (req, res) => {
  const { name, code } = req.body;

  if (!name || !code) {
    throw badRequest("Department name and code are required");
  }

  const department = await Department.create({ name, code });
  res.status(201).json(department);
};

export const createSection = async (req, res) => {
  const { name, departmentId, semester } = req.body;

  if (!name || !departmentId || !semester) {
    throw badRequest("Section name, department, and semester are required");
  }

  const department = await Department.findById(departmentId);

  if (!department) {
    throw badRequest("Department not found");
  }

  const section = await Section.create({
    name,
    department: departmentId,
    semester: Number(semester)
  });

  res.status(201).json(section);
};

export const createSubject = async (req, res) => {
  const { name, code, departmentId, semester } = req.body;

  if (!name || !code || !departmentId || !semester) {
    throw badRequest("Subject details are incomplete");
  }

  const department = await Department.findById(departmentId);
  if (!department) {
    throw badRequest("Department not found");
  }

  const subject = await Subject.create({
    name,
    code,
    department: departmentId,
    semester: Number(semester)
  });

  res.status(201).json(subject);
};

export const createStudent = async (req, res) => {
  const { name, email, password, rollNumber, departmentId, semester, sectionId } = req.body;

  if (!name || !email || !rollNumber || !departmentId || !semester || !sectionId) {
    throw badRequest("Student details are incomplete");
  }

  await ensureSectionAndDepartment({ departmentId, sectionId, semester });

  const passwordHash = await createPasswordHash(password || "College@123");
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "student"
  });

  const profile = await StudentProfile.create({
    user: user._id,
    rollNumber,
    department: departmentId,
    semester: Number(semester),
    section: sectionId
  });

  res.status(201).json({ user: mapUserResponse(user), profile });
};

export const updateStudent = async (req, res) => {
  const profile = await StudentProfile.findById(req.params.studentId).populate("user");

  if (!profile) {
    throw notFound("Student not found");
  }

  const { name, email, password, rollNumber, departmentId, semester, sectionId } = req.body;
  await ensureSectionAndDepartment({ departmentId, sectionId, semester });

  profile.user.name = name;
  profile.user.email = email.toLowerCase();

  if (password) {
    profile.user.passwordHash = await createPasswordHash(password);
    profile.user.markModified("passwordHash");
  }

  await profile.user.save();

  profile.rollNumber = rollNumber;
  profile.department = departmentId;
  profile.semester = Number(semester);
  profile.section = sectionId;
  await profile.save();

  res.json({ message: "Student updated" });
};

export const deleteStudent = async (req, res) => {
  const profile = await StudentProfile.findById(req.params.studentId);

  if (!profile) {
    throw notFound("Student not found");
  }

  await Promise.all([
    Attendance.deleteMany({ student: profile._id }),
    User.findByIdAndDelete(profile.user),
    StudentProfile.findByIdAndDelete(profile._id)
  ]);

  res.json({ message: "Student deleted" });
};

export const createTeacher = async (req, res) => {
  const { name, email, password, teacherId, departmentId } = req.body;

  if (!name || !email || !teacherId || !departmentId) {
    throw badRequest("Teacher details are incomplete");
  }

  const department = await Department.findById(departmentId);
  if (!department) {
    throw badRequest("Department not found");
  }

  const passwordHash = await createPasswordHash(password || "College@123");
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "teacher"
  });

  const profile = await TeacherProfile.create({
    user: user._id,
    teacherId,
    department: departmentId
  });

  res.status(201).json({ user: mapUserResponse(user), profile });
};

export const updateTeacher = async (req, res) => {
  const profile = await TeacherProfile.findById(req.params.teacherId).populate("user");

  if (!profile) {
    throw notFound("Teacher not found");
  }

  const { name, email, password, teacherCode, departmentId } = req.body;
  const department = await Department.findById(departmentId);

  if (!department) {
    throw badRequest("Department not found");
  }

  profile.user.name = name;
  profile.user.email = email.toLowerCase();

  if (password) {
    profile.user.passwordHash = await createPasswordHash(password);
    profile.user.markModified("passwordHash");
  }

  await profile.user.save();

  profile.teacherId = teacherCode;
  profile.department = departmentId;
  await profile.save();

  res.json({ message: "Teacher updated" });
};

export const deleteTeacher = async (req, res) => {
  const profile = await TeacherProfile.findById(req.params.teacherId);

  if (!profile) {
    throw notFound("Teacher not found");
  }

  const sessions = await Session.find({ teacher: profile._id }).select("_id");
  const sessionIds = sessions.map((session) => session._id);

  await Promise.all([
    Attendance.deleteMany({ session: { $in: sessionIds } }),
    Session.deleteMany({ teacher: profile._id }),
    TeacherAssignment.deleteMany({ teacher: profile._id }),
    Timetable.deleteMany({ teacher: profile._id }),
    User.findByIdAndDelete(profile.user),
    TeacherProfile.findByIdAndDelete(profile._id)
  ]);

  res.json({ message: "Teacher deleted" });
};

export const createAssignment = async (req, res) => {
  const { teacherId, subjectId, sectionId } = req.body;

  if (!teacherId || !subjectId || !sectionId) {
    throw badRequest("Assignment details are incomplete");
  }

  const [teacher, subject, section] = await Promise.all([
    TeacherProfile.findById(teacherId),
    Subject.findById(subjectId),
    Section.findById(sectionId)
  ]);

  if (!teacher || !subject || !section) {
    throw badRequest("Teacher, subject, or section was not found");
  }

  const assignment = await TeacherAssignment.create({
    teacher: teacherId,
    subject: subjectId,
    section: sectionId
  });

  res.status(201).json(assignment);
};

export const deleteAssignment = async (req, res) => {
  await TeacherAssignment.findByIdAndDelete(req.params.assignmentId);
  res.json({ message: "Assignment deleted" });
};

export const createTimetable = async (req, res) => {
  const { teacherId, subjectId, sectionId, dayOfWeek, startTime, endTime, room } = req.body;

  if (!teacherId || !subjectId || !sectionId || !dayOfWeek || !startTime || !endTime) {
    throw badRequest("Timetable details are incomplete");
  }

  const assignment = await TeacherAssignment.findOne({
    teacher: teacherId,
    subject: subjectId,
    section: sectionId
  });

  if (!assignment) {
    throw badRequest("Create the teacher assignment before adding this timetable");
  }

  const timetable = await Timetable.create({
    teacher: teacherId,
    subject: subjectId,
    section: sectionId,
    dayOfWeek,
    startTime,
    endTime,
    room
  });

  res.status(201).json(timetable);
};

export const deleteTimetable = async (req, res) => {
  await Timetable.findByIdAndDelete(req.params.timetableId);
  res.json({ message: "Timetable deleted" });
};

export const exportAttendanceReport = async (req, res) => {
  const { sectionId, subjectId, date = getTodayDateString() } = req.query;
  const sessionFilter = { sessionDate: date };

  if (sectionId) {
    sessionFilter.section = sectionId;
  }

  if (subjectId) {
    sessionFilter.subject = subjectId;
  }

  const sessions = await Session.find(sessionFilter)
    .populate("subject", "name code")
    .populate("section", "name semester");

  if (!sessions.length) {
    throw notFound("No sessions found for the selected filters");
  }

  const sessionMap = new Map(sessions.map((session) => [session._id.toString(), session]));
  const attendances = await Attendance.find({
    session: { $in: sessions.map((session) => session._id) }
  }).populate({
    path: "student",
    populate: { path: "user", select: "name email" }
  });

  const rows = attendances.map((attendance) => {
    const session = sessionMap.get(attendance.session.toString());

    return {
      Date: session.sessionDate,
      Subject: session.subject?.name || "",
      SubjectCode: session.subject?.code || "",
      Section: `${session.section?.name || ""} / Sem ${session.section?.semester || ""}`,
      Student: attendance.student?.user?.name || "",
      RollNumber: attendance.student?.rollNumber || "",
      Email: attendance.student?.user?.email || "",
      Status: attendance.status,
      ScanTime: attendance.scanTime ? new Date(attendance.scanTime).toLocaleString() : "",
      LateReason: attendance.lateReason || ""
    };
  });

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
  const fileBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=attendance-report-${date}.xlsx`
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.send(fileBuffer);
};

export const getTeacherDashboard = async (req, res) => {
  const teacher = await getTeacherProfileByUser(req.user._id);
  const todayDate = getTodayDateString();
  const weekday = getTodayWeekday();

  const [todayClasses, todaySessions] = await Promise.all([
    Timetable.find({ teacher: teacher._id, dayOfWeek: weekday })
      .populate("subject", "name code semester")
      .populate("section", "name semester")
      .sort({ startTime: 1 }),
    Session.find({ teacher: teacher._id, sessionDate: todayDate })
      .populate("subject", "name code semester")
      .populate("section", "name semester")
      .sort({ createdAt: -1 })
  ]);

  const sessionMap = new Map(todaySessions.map((session) => [session.timetable.toString(), session]));
  const pendingLateIds = todaySessions.map((session) => session._id);
  const pendingLateCount = pendingLateIds.length
    ? await Attendance.countDocuments({ session: { $in: pendingLateIds }, status: "late_pending" })
    : 0;

  res.json({
    teacher,
    metrics: {
      todaysClasses: todayClasses.length,
      todaysSessions: todaySessions.length,
      pendingLateRequests: pendingLateCount
    },
    todayClasses: todayClasses.map((entry) => ({
      ...entry.toObject(),
      currentSession: sessionMap.get(entry._id.toString()) || null
    }))
  });
};

export const startSession = async (req, res) => {
  const teacher = await getTeacherProfileByUser(req.user._id);
  const timetable = await Timetable.findById(req.params.timetableId)
    .populate("subject", "name code semester")
    .populate("section", "name semester");

  if (!timetable) {
    throw notFound("Timetable entry not found");
  }

  if (timetable.teacher.toString() !== teacher._id.toString()) {
    throw badRequest("This timetable entry is not assigned to you");
  }

  const todayDate = getTodayDateString();
  const scheduledStartAt = combineDateAndTime(todayDate, timetable.startTime);
  const scheduledEndAt = combineDateAndTime(todayDate, timetable.endTime);

  if (scheduledEndAt.getTime() <= Date.now()) {
    throw badRequest("This class window has already ended");
  }

  const existingSession = await Session.findOne({
    timetable: timetable._id,
    sessionDate: todayDate
  });

  if (existingSession) {
    if (existingSession.status === "ended") {
      throw conflict("Attendance session for this class has already been completed today");
    }

    const activeSession = await ensureSessionIsCurrent(existingSession);

    if (activeSession.status === "ended") {
      throw conflict("Attendance session for this class has already ended");
    }

    const qr = await refreshQrForSession(activeSession);
    return res.json({
      session: activeSession,
      qr
    });
  }

  const session = await Session.create({
    timetable: timetable._id,
    teacher: teacher._id,
    subject: timetable.subject._id,
    section: timetable.section._id,
    sessionDate: todayDate,
    scheduledStartAt,
    scheduledEndAt,
    startedAt: new Date(),
    lateAfterMinutes: 15
  });

  const qr = await refreshQrForSession(session, true);

  res.status(201).json({
    session,
    qr
  });
};

export const endSession = async (req, res) => {
  const teacher = await getTeacherProfileByUser(req.user._id);
  const session = await Session.findById(req.params.sessionId);

  if (!session) {
    throw notFound("Session not found");
  }

  if (session.teacher.toString() !== teacher._id.toString()) {
    throw badRequest("This session is not assigned to you");
  }

  const finalizedSession = await finalizeSession(session);
  const attendances = await Attendance.find({ session: finalizedSession._id });
  const summary = attendanceSummaryFromRoster(
    attendances.map((attendance) => ({ status: attendance.status }))
  );

  res.json({
    session: finalizedSession,
    summary
  });
};

export const getSessionQr = async (req, res) => {
  const teacher = await getTeacherProfileByUser(req.user._id);
  let session = await Session.findById(req.params.sessionId)
    .populate("subject", "name code semester")
    .populate("section", "name semester");

  if (!session) {
    throw notFound("Session not found");
  }

  if (session.teacher.toString() !== teacher._id.toString()) {
    throw badRequest("This session is not assigned to you");
  }

  session = await ensureSessionIsCurrent(session);

  if (session.status === "ended") {
    return res.json({
      session,
      qr: null
    });
  }

  const qr = await refreshQrForSession(session);

  res.json({
    session,
    qr
  });
};

export const getSessionAttendance = async (req, res) => {
  const teacher = await getTeacherProfileByUser(req.user._id);
  let session = await Session.findById(req.params.sessionId)
    .populate("subject", "name code semester")
    .populate("section", "name semester");

  if (!session) {
    throw notFound("Session not found");
  }

  if (session.teacher.toString() !== teacher._id.toString()) {
    throw badRequest("This session is not assigned to you");
  }

  session = await ensureSessionIsCurrent(session);

  const [students, attendanceDocs] = await Promise.all([
    StudentProfile.find({ section: session.section._id })
      .populate("user", "name email")
      .sort({ rollNumber: 1 }),
    Attendance.find({ session: session._id })
  ]);

  const attendanceMap = new Map(attendanceDocs.map((item) => [item.student.toString(), item]));
  const roster = students.map((student) => {
    const attendance = attendanceMap.get(student._id.toString());
    return {
      attendanceId: attendance?._id || null,
      studentId: student._id,
      studentName: student.user?.name || "",
      email: student.user?.email || "",
      rollNumber: student.rollNumber,
      status: attendance?.status || "absent",
      scanTime: attendance?.scanTime || null,
      lateReason: attendance?.lateReason || ""
    };
  });

  res.json({
    session,
    summary: attendanceSummaryFromRoster(roster),
    roster
  });
};

export const decideLateRequest = async (req, res) => {
  const teacher = await getTeacherProfileByUser(req.user._id);
  const { decision } = req.body;

  if (!["approve", "decline"].includes(decision)) {
    throw badRequest("Decision must be approve or decline");
  }

  const attendance = await Attendance.findById(req.params.attendanceId).populate("session");

  if (!attendance) {
    throw notFound("Attendance request not found");
  }

  if (!attendance.session || attendance.session.teacher.toString() !== teacher._id.toString()) {
    throw badRequest("This attendance request is not assigned to you");
  }

  if (attendance.status !== "late_pending") {
    throw badRequest("This request has already been decided");
  }

  attendance.status = decision === "approve" ? "late_approved" : "late_rejected";
  attendance.teacherDecisionBy = req.user._id;
  attendance.teacherDecisionAt = new Date();
  await attendance.save();

  res.json({
    message: `Late request ${decision}d successfully`
  });
};

export const getStudentDashboard = async (req, res) => {
  const student = await getStudentProfileByUser(req.user._id);
  const attendances = await Attendance.find({ student: student._id })
    .populate({
      path: "session",
      populate: { path: "subject", select: "name code semester" }
    })
    .sort({ createdAt: -1 });

  const perSubject = new Map();

  for (const attendance of attendances) {
    const subject = attendance.session?.subject;
    const subjectKey = subject?._id?.toString() || "unknown";

    if (!perSubject.has(subjectKey)) {
      perSubject.set(subjectKey, {
        subjectId: subject?._id || null,
        subjectName: subject?.name || "Unknown Subject",
        subjectCode: subject?.code || "",
        totalClasses: 0,
        attendedClasses: 0,
        pendingLate: 0,
        absentClasses: 0
      });
    }

    const stats = perSubject.get(subjectKey);
    stats.totalClasses += 1;

    if (isAttendanceCountedAsPresent(attendance.status)) {
      stats.attendedClasses += 1;
    } else if (attendance.status === "late_pending") {
      stats.pendingLate += 1;
    } else {
      stats.absentClasses += 1;
    }
  }

  const subjectStats = Array.from(perSubject.values()).map((entry) => ({
    ...entry,
    percentage: entry.totalClasses
      ? Math.round((entry.attendedClasses / entry.totalClasses) * 100)
      : 0
  }));

  const overall = subjectStats.reduce(
    (summary, entry) => {
      summary.totalClasses += entry.totalClasses;
      summary.attendedClasses += entry.attendedClasses;
      summary.pendingLate += entry.pendingLate;
      summary.absentClasses += entry.absentClasses;
      return summary;
    },
    { totalClasses: 0, attendedClasses: 0, pendingLate: 0, absentClasses: 0 }
  );

  res.json({
    student,
    metrics: {
      ...overall,
      percentage: overall.totalClasses
        ? Math.round((overall.attendedClasses / overall.totalClasses) * 100)
        : 0
    },
    subjectStats,
    recentAttendance: attendances.slice(0, 8).map((attendance) => ({
      _id: attendance._id,
      status: attendance.status,
      scanTime: attendance.scanTime,
      lateReason: attendance.lateReason,
      sessionDate: attendance.session?.sessionDate,
      subjectName: attendance.session?.subject?.name || "",
      subjectCode: attendance.session?.subject?.code || ""
    }))
  });
};

export const getStudentHistory = async (req, res) => {
  const student = await getStudentProfileByUser(req.user._id);
  const history = await Attendance.find({ student: student._id })
    .populate({
      path: "session",
      populate: [
        { path: "subject", select: "name code semester" },
        { path: "section", select: "name semester" }
      ]
    })
    .sort({ createdAt: -1 });

  res.json({
    history: history.map((attendance) => ({
      _id: attendance._id,
      status: attendance.status,
      scanTime: attendance.scanTime,
      lateReason: attendance.lateReason,
      sessionDate: attendance.session?.sessionDate,
      subjectName: attendance.session?.subject?.name || "",
      subjectCode: attendance.session?.subject?.code || "",
      sectionName: attendance.session?.section?.name || "",
      semester: attendance.session?.section?.semester || ""
    }))
  });
};

export const scanAttendance = async (req, res) => {
  const student = await getStudentProfileByUser(req.user._id);
  const { sessionId, token, lateReason } = req.body;

  if (!sessionId || !token) {
    throw badRequest("Session ID and QR token are required");
  }

  let session = await Session.findById(sessionId);

  if (!session) {
    throw notFound("Session not found");
  }

  session = await ensureSessionIsCurrent(session);

  if (session.status !== "active") {
    throw badRequest("This attendance session is no longer active");
  }

  if (session.section.toString() !== student.section._id.toString()) {
    throw badRequest("You are not assigned to this class section");
  }

  if (
    !session.currentQrToken ||
    session.currentQrToken !== token ||
    !session.qrTokenExpiresAt ||
    session.qrTokenExpiresAt.getTime() <= Date.now()
  ) {
    throw badRequest("This QR code has expired. Ask your teacher to refresh it.");
  }

  const existingAttendance = await Attendance.findOne({
    session: session._id,
    student: student._id
  });

  if (existingAttendance) {
    throw conflict("Attendance has already been marked for this session");
  }

  const lateThreshold = new Date(session.scheduledStartAt.getTime() + session.lateAfterMinutes * 60 * 1000);
  const isLate = Date.now() > lateThreshold.getTime();

  if (isLate && !lateReason?.trim()) {
    throw conflict("You are late. Submit a reason to request attendance.", {
      requiresReason: true
    });
  }

  const attendance = await Attendance.create({
    session: session._id,
    student: student._id,
    status: isLate ? "late_pending" : "present",
    lateReason: isLate ? lateReason.trim() : ""
  });

  res.status(201).json({
    message: isLate
      ? "Late attendance request sent to your teacher"
      : "Attendance marked successfully",
    attendance
  });
};
