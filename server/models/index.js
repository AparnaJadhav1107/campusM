import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "student"], default: "student" },
    studentRef: { type: String },
  },
  { timestamps: true }
);

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: Number, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    department: String,
    course: String,
    year: Number,
    status: { type: String, default: "Active" },
  },
  { timestamps: true }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: { type: String, unique: true },
    studentId: Number,
    studentName: String,
    category: {
      type: String,
      enum: ["Classroom", "Hostel", "Library", "Laboratory", "Transportation", "Other"],
    },
    description: String,
    location: String,
    priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    status: {
      type: String,
      enum: ["Submitted", "Pending", "Under Review", "Assigned", "Resolved", "Rejected"],
      default: "Submitted",
    },
    assignedTo: String,
    adminNotes: String,
  },
  { timestamps: true }
);

const historySchema = new mongoose.Schema(
  {
    complaintId: String,
    action: String,
    previousStatus: String,
    newStatus: String,
    adminId: String,
  },
  { timestamps: true }
);

const locationSchema = new mongoose.Schema(
  { name: { type: String, unique: true }, type: String },
  { timestamps: true }
);

const edgeSchema = new mongoose.Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    weight: { type: Number, default: 1 },
  },
  { timestamps: true }
);

const activitySchema = new mongoose.Schema(
  { action: String, actor: String, detail: String },
  { timestamps: true }
);

const notificationSchema = new mongoose.Schema(
  { userId: String, message: String, read: { type: Boolean, default: false } },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const StudentModel = mongoose.models.Student || mongoose.model("Student", studentSchema);
export const ComplaintModel = mongoose.models.Complaint || mongoose.model("Complaint", complaintSchema);
export const ComplaintHistoryModel =
  mongoose.models.ComplaintHistory || mongoose.model("ComplaintHistory", historySchema);
export const CampusLocationModel =
  mongoose.models.CampusLocation || mongoose.model("CampusLocation", locationSchema);
export const CampusEdgeModel = mongoose.models.CampusEdge || mongoose.model("CampusEdge", edgeSchema);
export const ActivityLogModel = mongoose.models.ActivityLog || mongoose.model("ActivityLog", activitySchema);
export const NotificationModel =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
