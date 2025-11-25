// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/otp_verify")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Uploads
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

app.use("/uploads", express.static(uploadDir));

// Mailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  requireTLS: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

/**
 * Default meta config for concerns and buildings.
 * These match Create.jsx and AdminEdit.jsx.
 */
const DEFAULT_BUILDINGS = [
  "Ayuntamiento",
  "JFH",
  "ICTC",
  "PCH",
  "Food Square",
  "COS",
  "CBAA",
  "CTHM",
  "GMH",
  "CEAT",
  "Other",
];

const DEFAULT_CONCERNS = [
  {
    id: "electrical",
    label: "Electrical",
    subconcerns: ["Lights", "Aircons", "Wires", "Outlets", "Switches", "Other"],
  },
  {
    id: "civil",
    label: "Civil",
    subconcerns: ["Walls", "Ceilings", "Cracks", "Doors", "Windows", "Other"],
  },
  {
    id: "mechanical",
    label: "Mechanical",
    subconcerns: ["TV", "Projectors", "Fans", "Elevators", "Other"],
  },
  {
    id: "safety-hazard",
    label: "Safety Hazard",
    subconcerns: ["Spikes", "Open Wires", "Blocked Exits", "Wet Floor", "Other"],
  },
  {
    id: "other",
    label: "Other",
    subconcerns: ["Other"],
  },
];

// Schemas
const commentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    at: { type: Date, default: Date.now },
    by: { type: String, default: "System" },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema({
  heading: String,
  description: String,

  // Concern details
  concern: String,
  subConcern: String,
  otherConcern: String,

  // Location details
  building: String,
  otherBuilding: String,
  college: { type: String, default: "Unspecified" },
  room: { type: String, default: "" },
  otherRoom: String,

  status: {
    type: String,
    default: "Pending",
    enum: ["Pending", "In Progress", "Resolved", "Archived"],
  },
  image: String,
  comments: { type: [commentSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  email: String,
});

const Report = mongoose.model("Report", reportSchema);

// Lists with progress
const taskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const listSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, default: "Untitled" },
  tasks: { type: [taskSchema], default: [] },
  collapsed: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
});

const List = mongoose.model("List", listSchema);

// Meta config schema for concerns and buildings
const concernConfigSchema = new mongoose.Schema(
  {
    id: { type: String },
    label: { type: String },
    subconcerns: { type: [String], default: [] },
  },
  { _id: false }
);

const metaSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // always "default"
  buildings: { type: [String], default: DEFAULT_BUILDINGS },
  concerns: { type: [concernConfigSchema], default: DEFAULT_CONCERNS },
});

const MetaConfig = mongoose.model("MetaConfig", metaSchema);

// OTP schema
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

const OTP = mongoose.model("OTP", otpSchema);

async function compare(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

// OTP routes
app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email required" });
  }

  if (!email.endsWith("@dlsud.edu.ph")) {
    return res.status(400).json({
      success: false,
      message: "Only @dlsud.edu.ph emails are allowed",
    });
  }

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const ttlMinutes = Number(process.env.OTP_TTL_MINUTES || 10);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await OTP.findOneAndUpdate(
      { email },
      { codeHash, expiresAt },
      { upsert: true, new: true }
    );

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Your OTP Code",
      html: `<h2>Your Verification Code</h2><h1>${code}</h1><p>Valid for ${ttlMinutes} minutes.</p>`,
    });

    res.json({ success: true, message: "OTP sent" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to send OTP" });
  }
});

app.post("/api/verify-otp", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res
      .status(400)
      .json({ success: false, message: "Email and code required" });
  }

  try {
    const record = await OTP.findOne({ email });
    if (!record) {
      return res
        .status(400)
        .json({ success: false, message: "OTP expired or invalid" });
    }

    const isValid = await compare(code, record.codeHash);
    if (!isValid) {
      return res
        .status(400)
        .json({ success: false, message: "OTP invalid" });
    }

    await OTP.deleteOne({ email });
    res.json({ success: true, message: "Email verified" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res
      .status(500)
      .json({ success: false, message: "OTP verification failed" });
  }
});

// Reports routes
app.post("/api/reports", upload.single("imageFile"), async (req, res) => {
  try {
    const {
      email,
      heading,
      description,
      concern,
      subConcern,
      otherConcern,
      building,
      otherBuilding,
      college,
      room,
      otherRoom,
    } = req.body;

    const report = await Report.create({
      email,
      heading,
      description,

      concern,
      subConcern: subConcern || "",
      otherConcern: otherConcern || "",

      building,
      otherBuilding: otherBuilding || "",
      college: college || "Unspecified",
      room: room || "",
      otherRoom: otherRoom || "",

      image: req.file ? `/uploads/${req.file.filename}` : null,
    });

    res.json({ success: true, report });
  } catch (err) {
    console.error("Report submission error:", err);
    res
      .status(500)
      .json({ success: false, message: err.message });
  }
});

app.get("/api/reports", async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error("Get reports error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch reports" });
  }
});

// Existing update route (status and optional comment)
app.put("/api/reports/:id", async (req, res) => {
  try {
    const { status, comment, by } = req.body;
    const set = {};
    if (status) set.status = status;

    const push = comment
      ? { comments: { text: comment, by: by || "Admin" } }
      : null;

    const update = push ? { $set: set, $push: push } : { $set: set };

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Not found" });
    }

    res.json({ success: true, report });
  } catch (err) {
    console.error("Update report error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update report" });
  }
});

// New comment route used by React
app.post("/api/reports/:id/comments", async (req, res) => {
  try {
    const { text, by } = req.body;

    if (!text || !text.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Comment text is required" });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            text: text.trim(),
            by: by || "Admin",
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    res.json(report);
  } catch (err) {
    console.error("Add comment error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to add comment" });
  }
});

// Delete route
app.delete("/api/reports/:id", async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Not found" });
    }

    if (report.image) {
      const abs = path.join(__dirname, report.image.replace(/^\//, ""));
      fs.unlink(abs, () => {});
    }

    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error("Delete error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete report" });
  }
});

// Lists routes
app.get("/api/lists", async (req, res) => {
  try {
    const lists = await List.find().sort({ updatedAt: -1 });
    res.json(lists);
  } catch (err) {
    console.error("Get lists error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch lists" });
  }
});

app.post("/api/lists/sync", async (req, res) => {
  try {
    const { lists } = req.body;
    if (!Array.isArray(lists)) {
      return res
        .status(400)
        .json({ success: false, message: "lists must be an array" });
    }

    await List.deleteMany({});
    const withTimestamps = lists.map((l) => ({
      ...l,
      updatedAt: new Date(),
    }));

    await List.insertMany(withTimestamps);
    res.json({ success: true, count: withTimestamps.length });
  } catch (err) {
    console.error("Sync lists error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to sync lists" });
  }
});

// Meta config routes for concerns and buildings
app.get("/api/meta", async (req, res) => {
  try {
    let doc = await MetaConfig.findOne({ key: "default" });
    if (!doc) {
      doc = await MetaConfig.create({
        key: "default",
        buildings: DEFAULT_BUILDINGS,
        concerns: DEFAULT_CONCERNS,
      });
    }

    res.json({
      buildings: doc.buildings || DEFAULT_BUILDINGS,
      concerns: doc.concerns || DEFAULT_CONCERNS,
    });
  } catch (err) {
    console.error("Get meta error:", err);
    // If something goes wrong, still return defaults so frontend works
    res.json({
      buildings: DEFAULT_BUILDINGS,
      concerns: DEFAULT_CONCERNS,
    });
  }
});

app.put("/api/meta", async (req, res) => {
  try {
    const { buildings, concerns } = req.body || {};

    const safeBuildings = Array.isArray(buildings) && buildings.length
      ? buildings
      : DEFAULT_BUILDINGS;

    const safeConcerns = Array.isArray(concerns) && concerns.length
      ? concerns
      : DEFAULT_CONCERNS;

    const doc = await MetaConfig.findOneAndUpdate(
      { key: "default" },
      {
        buildings: safeBuildings,
        concerns: safeConcerns,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      buildings: doc.buildings,
      concerns: doc.concerns,
    });
  } catch (err) {
    console.error("Update meta error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update meta config" });
  }
});

// JSON 404 for unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "API route not found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);   