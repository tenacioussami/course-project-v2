const mongoose = require('mongoose');

// Singleton-style document holding project overview + about info
const projectSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Untitled Project' },
    problemStatement: { type: String, default: '' },
    objectives: { type: String, default: '' },
    proposedSolution: { type: String, default: '' },
    methodology: { type: String, default: '' },
    expectedOutcomes: { type: String, default: '' },
    technologiesUsed: { type: String, default: '' },
    timeline: { type: String, default: '' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    description: { type: String, default: '' },
    // About page fields
    courseName: { type: String, default: '' },
    courseCode: { type: String, default: '' },
    instructor: { type: String, default: '' },
    department: { type: String, default: '' },
    university: { type: String, default: '' },
    contactInfo: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
