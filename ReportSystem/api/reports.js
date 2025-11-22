// api/reports.js
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import Report from '../models/Report';
import dotenv from 'dotenv';

dotenv.config();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

export async function createReport(req, res) {
  try {
    const { email, heading, description, concern, subConcern, otherConcern, building, otherBuilding, college, room, otherRoom } = req.body;

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
    console.error('Report submission error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getReports(req, res) {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
}
