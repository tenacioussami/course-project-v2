const mongoose = require('mongoose');

const elementSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    documentUrl: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Element', elementSchema);
