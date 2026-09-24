const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    authors: { type: String, default: '' },
    abstract: { type: String, default: '' },
    keywords: { type: String, default: '' },
    introduction: { type: String, default: '' },
    methodology: { type: String, default: '' },
    results: { type: String, default: '' },
    discussion: { type: String, default: '' },
    conclusion: { type: String, default: '' },
    references: { type: String, default: '' },
    status: { type: String, enum: ['Draft', 'Under Review', 'Revision', 'Completed'], default: 'Draft' },
    fileUrl: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Paper', paperSchema);
