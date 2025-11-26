// models/MetaConfig.js
import mongoose from 'mongoose';

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
  buildings: { type: [String], default: [] },
  concerns: { type: [concernConfigSchema], default: [] },
});

const MetaConfig = mongoose.models.MetaConfig || mongoose.model('MetaConfig', metaSchema);
export default MetaConfig;
