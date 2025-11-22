// api/meta.js
import MetaConfig from '../models/MetaConfig';
import dotenv from 'dotenv';

dotenv.config();

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
  { id: "electrical", label: "Electrical", subconcerns: ["Lights", "Aircons", "Wires", "Outlets", "Switches", "Other"] },
  { id: "civil", label: "Civil", subconcerns: ["Walls", "Ceilings", "Cracks", "Doors", "Windows", "Other"] },
  { id: "mechanical", label: "Mechanical", subconcerns: ["TV", "Projectors", "Fans", "Elevators", "Other"] },
  { id: "safety-hazard", label: "Safety Hazard", subconcerns: ["Spikes", "Open Wires", "Blocked Exits", "Wet Floor", "Other"] },
  { id: "other", label: "Other", subconcerns: ["Other"] }
];

export async function getMetaConfig(req, res) {
  try {
    let doc = await MetaConfig.findOne({ key: 'default' });
    if (!doc) {
      doc = await MetaConfig.create({
        key: 'default',
        buildings: DEFAULT_BUILDINGS,
        concerns: DEFAULT_CONCERNS,
      });
    }

    res.json({
      buildings: doc.buildings || DEFAULT_BUILDINGS,
      concerns: doc.concerns || DEFAULT_CONCERNS,
    });
  } catch (err) {
    console.error('Get meta error:', err);
    res.json({
      buildings: DEFAULT_BUILDINGS,
      concerns: DEFAULT_CONCERNS,
    });
  }
}

export async function updateMetaConfig(req, res) {
  const { buildings, concerns } = req.body;

  const safeBuildings = Array.isArray(buildings) && buildings.length ? buildings : DEFAULT_BUILDINGS;
  const safeConcerns = Array.isArray(concerns) && concerns.length ? concerns : DEFAULT_CONCERNS;

  try {
    const doc = await MetaConfig.findOneAndUpdate(
      { key: 'default' },
      { buildings: safeBuildings, concerns: safeConcerns },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      buildings: doc.buildings,
      concerns: doc.concerns,
    });
  } catch (err) {
    console.error('Update meta error:', err);
    res.status(500).json({ success: false, message: 'Failed to update meta config' });
  }
}
