const mongoose = require('mongoose');

const literatureSchema = new mongoose.Schema(
  {
    paperTitle: { type: String, required: true },
    authors: { type: String, default: '' },
    publicationYear: { type: Number },
    journal: { type: String, default: '' },
    doi: { type: String, default: '' },
    abstract: { type: String, default: '' },
    content: { type: String, default: '' },
    keyFindings: { type: String, default: '' },
    researchGap: { type: String, default: '' },
    referenceLink: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Literature', literatureSchema);