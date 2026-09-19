import crypto from "crypto";
import QRCode from "qrcode";
import { Attendance, Session, StudentProfile } from "./models.js";

const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";

export const isAttendanceCountedAsPresent = (status) =>
  ["present", "late_approved"].includes(status);

export const getTodayDateString = (timeZone = APP_TIMEZONE) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

export const getTodayWeekday = (timeZone = APP_TIMEZONE) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long"
  }).format(new Date());

export const combineDateAndTime = (dateString, timeString) => new Date(`${dateString}T${timeString}:00`);

export const generateSessionToken = () => crypto.randomBytes(24).toString("hex");

export const buildQrPayloadString = (sessionId, token) =>
  JSON.stringify({
    type: "attendance_session",
    sessionId,
    token
  });

export const refreshQrForSession = async (session, forceRefresh = false) => {
  if (!session || session.status !== "active") {
    return null;
  }

  const ttlSeconds = Number(process.env.QR_TOKEN_TTL_SECONDS || 25);
  const shouldRefresh =
    forceRefresh ||
    !session.currentQrToken ||
    !session.qrTokenExpiresAt ||
    session.qrTokenExpiresAt.getTime() <= Date.now();

  if (shouldRefresh) {
    session.currentQrToken = generateSessionToken();
    session.qrTokenExpiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await session.save();
  }

  const qrPayload = buildQrPayloadString(session._id.toString(), session.currentQrToken);
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320
  });

  return {
    qrPayload,
    qrDataUrl,
    expiresAt: session.qrTokenExpiresAt
  };
};

export const finalizeSession = async (session) => {
  if (!session || session.status === "ended") {
    return session;
  }

  const students = await StudentProfile.find({ section: session.section }).select("_id");
  const markedAttendances = await Attendance.find({ session: session._id }).select("student");
  const markedStudentIds = new Set(markedAttendances.map((item) => item.student.toString()));
  const absentPayload = students
    .filter((student) => !markedStudentIds.has(student._id.toString()))
    .map((student) => ({
      session: session._id,
      student: student._id,
      status: "absent"
    }));

  if (absentPayload.length) {
    await Attendance.insertMany(absentPayload, { ordered: false });
  }

  session.status = "ended";
  session.endedAt = session.endedAt || new Date();
  session.currentQrToken = null;
  session.qrTokenExpiresAt = null;
  await session.save();

  return Session.findById(session._id);
};

export const ensureSessionIsCurrent = async (session) => {
  if (!session) {
    return null;
  }

  if (session.status === "active" && session.scheduledEndAt.getTime() <= Date.now()) {
    return finalizeSession(session);
  }

  return session;
};
