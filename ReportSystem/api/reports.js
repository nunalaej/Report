// api/reports.js
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import Report from '../models/Report'; // Import the Report model
import connectToDatabase from '../utils/db'; // Import the MongoDB connection utility
import dotenv from 'dotenv';

dotenv.config();

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage });

export default async (req, res) => {
  if (req.method === 'POST') {
    return upload.single('imageFile')(req, res, async (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });

      // Ensure the database is connected before performing any database operations
      await connectToDatabase();

      const { email, heading, description, concern, subConcern, otherConcern, building, otherBuilding, college, room, otherRoom } = req.body;

      try {
        const report = await Report.create({
          email,
          heading,
          description,
          concern,
          subConcern: subConcern || '',
          otherConcern: otherConcern || '',
          building,
          otherBuilding: otherBuilding || '',
          college: college || 'Unspecified',
          room: room || '',
          otherRoom: otherRoom || '',
          image: req.file ? `/uploads/${req.file.filename}` : null,
        });

        res.json({ success: true, report });
      } catch (err) {
        console.error('Report submission error:', err);
        res.status(500).json({ success: false, message: 'Failed to create report' });
      }
    });
  }

  if (req.method === 'GET') {
    try {
      await connectToDatabase();
      const reports = await Report.find().sort({ createdAt: -1 });
      res.json(reports);
    } catch (err) {
      console.error('Get reports error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch reports' });
    }
  }

  res.status(405).json({ success: false, message: 'Method Not Allowed' });
};
