// models/Report.js
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    at: { type: Date, default: Date.now },
    by: { type: String, default: 'System' },
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
  college: { type: String, default: 'Unspecified' },
  room: { type: String, default: '' },
  otherRoom: String,

  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'In Progress', 'Resolved', 'Archived'],
  },
  image: String,
  comments: { type: [commentSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  email: String,
});

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
export default Report;
