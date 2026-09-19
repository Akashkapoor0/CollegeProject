import express from "express";
import {
  asyncHandler,
  createAssignment,
  createDepartment,
  createSection,
  createStudent,
  createSubject,
  createTeacher,
  createTimetable,
  decideLateRequest,
  deleteAssignment,
  deleteStudent,
  deleteTeacher,
  deleteTimetable,
  endSession,
  exportAttendanceReport,
  getAdminBootstrap,
  getAdminDashboard,
  getCurrentUser,
  getSessionAttendance,
  getSessionQr,
  getStudentDashboard,
  getStudentHistory,
  getTeacherDashboard,
  login,
  scanAttendance,
  startSession,
  updateStudent,
  updateTeacher
} from "./controllers.js";
import { authorize, protect } from "./middleware/auth.js";

const router = express.Router();

router.post("/auth/login", asyncHandler(login));
router.get("/auth/me", protect, asyncHandler(getCurrentUser));

router.get("/admin/dashboard", protect, authorize("admin"), asyncHandler(getAdminDashboard));
router.get("/admin/bootstrap", protect, authorize("admin"), asyncHandler(getAdminBootstrap));
router.post("/admin/departments", protect, authorize("admin"), asyncHandler(createDepartment));
router.post("/admin/sections", protect, authorize("admin"), asyncHandler(createSection));
router.post("/admin/subjects", protect, authorize("admin"), asyncHandler(createSubject));
router.post("/admin/students", protect, authorize("admin"), asyncHandler(createStudent));
router.put("/admin/students/:studentId", protect, authorize("admin"), asyncHandler(updateStudent));
router.delete("/admin/students/:studentId", protect, authorize("admin"), asyncHandler(deleteStudent));
router.post("/admin/teachers", protect, authorize("admin"), asyncHandler(createTeacher));
router.put("/admin/teachers/:teacherId", protect, authorize("admin"), asyncHandler(updateTeacher));
router.delete("/admin/teachers/:teacherId", protect, authorize("admin"), asyncHandler(deleteTeacher));
router.post("/admin/assignments", protect, authorize("admin"), asyncHandler(createAssignment));
router.delete("/admin/assignments/:assignmentId", protect, authorize("admin"), asyncHandler(deleteAssignment));
router.post("/admin/timetables", protect, authorize("admin"), asyncHandler(createTimetable));
router.delete("/admin/timetables/:timetableId", protect, authorize("admin"), asyncHandler(deleteTimetable));
router.get("/admin/reports/export", protect, authorize("admin"), asyncHandler(exportAttendanceReport));

router.get("/teacher/dashboard", protect, authorize("teacher"), asyncHandler(getTeacherDashboard));
router.post("/teacher/sessions/start/:timetableId", protect, authorize("teacher"), asyncHandler(startSession));
router.post("/teacher/sessions/end/:sessionId", protect, authorize("teacher"), asyncHandler(endSession));
router.get("/teacher/sessions/:sessionId/qr", protect, authorize("teacher"), asyncHandler(getSessionQr));
router.get(
  "/teacher/sessions/:sessionId/attendance",
  protect,
  authorize("teacher"),
  asyncHandler(getSessionAttendance)
);
router.post(
  "/teacher/late-requests/:attendanceId/decision",
  protect,
  authorize("teacher"),
  asyncHandler(decideLateRequest)
);

router.get("/student/dashboard", protect, authorize("student"), asyncHandler(getStudentDashboard));
router.get("/student/history", protect, authorize("student"), asyncHandler(getStudentHistory));
router.post("/student/scan", protect, authorize("student"), asyncHandler(scanAttendance));

export default router;
