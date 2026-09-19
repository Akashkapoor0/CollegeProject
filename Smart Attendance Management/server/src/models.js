import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "teacher", "student"], required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const departmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true }
  },
  { timestamps: true }
);

const sectionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, uppercase: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    semester: { type: Number, required: true, min: 1, max: 8 }
  },
  { timestamps: true }
);

sectionSchema.index({ department: 1, semester: 1, name: 1 }, { unique: true });

const subjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    semester: { type: Number, required: true, min: 1, max: 8 }
  },
  { timestamps: true }
);

const studentProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", unique: true, required: true },
    rollNumber: { type: String, required: true, trim: true, uppercase: true, unique: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    section: { type: Schema.Types.ObjectId, ref: "Section", required: true }
  },
  { timestamps: true }
);

const teacherProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", unique: true, required: true },
    teacherId: { type: String, required: true, trim: true, uppercase: true, unique: true },
    department: { type: Schema.Types.ObjectId, ref: "Department", required: true }
  },
  { timestamps: true }
);

const teacherAssignmentSchema = new Schema(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "TeacherProfile", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    section: { type: Schema.Types.ObjectId, ref: "Section", required: true }
  },
  { timestamps: true }
);

teacherAssignmentSchema.index({ teacher: 1, subject: 1, section: 1 }, { unique: true });

const timetableSchema = new Schema(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "TeacherProfile", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    section: { type: Schema.Types.ObjectId, ref: "Section", required: true },
    dayOfWeek: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String, trim: true, default: "" }
  },
  { timestamps: true }
);

const sessionSchema = new Schema(
  {
    timetable: { type: Schema.Types.ObjectId, ref: "Timetable", required: true },
    teacher: { type: Schema.Types.ObjectId, ref: "TeacherProfile", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    section: { type: Schema.Types.ObjectId, ref: "Section", required: true },
    sessionDate: { type: String, required: true },
    scheduledStartAt: { type: Date, required: true },
    scheduledEndAt: { type: Date, required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
    status: { type: String, enum: ["active", "ended"], default: "active" },
    lateAfterMinutes: { type: Number, default: 15 },
    currentQrToken: { type: String, default: null },
    qrTokenExpiresAt: { type: Date, default: null }
  },
  { timestamps: true }
);

sessionSchema.index({ timetable: 1, sessionDate: 1 }, { unique: true });

const attendanceSchema = new Schema(
  {
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true },
    student: { type: Schema.Types.ObjectId, ref: "StudentProfile", required: true },
    status: {
      type: String,
      enum: ["present", "late_pending", "late_approved", "late_rejected", "absent"],
      required: true
    },
    scanTime: { type: Date, default: Date.now },
    lateReason: { type: String, trim: true, default: "" },
    teacherDecisionBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    teacherDecisionAt: { type: Date, default: null }
  },
  { timestamps: true }
);

attendanceSchema.index({ session: 1, student: 1 }, { unique: true });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Department = mongoose.models.Department || mongoose.model("Department", departmentSchema);
export const Section = mongoose.models.Section || mongoose.model("Section", sectionSchema);
export const Subject = mongoose.models.Subject || mongoose.model("Subject", subjectSchema);
export const StudentProfile =
  mongoose.models.StudentProfile || mongoose.model("StudentProfile", studentProfileSchema);
export const TeacherProfile =
  mongoose.models.TeacherProfile || mongoose.model("TeacherProfile", teacherProfileSchema);
export const TeacherAssignment =
  mongoose.models.TeacherAssignment || mongoose.model("TeacherAssignment", teacherAssignmentSchema);
export const Timetable = mongoose.models.Timetable || mongoose.model("Timetable", timetableSchema);
export const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);
export const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
