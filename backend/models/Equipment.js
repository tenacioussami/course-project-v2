const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    availability: { type: Boolean, default: true },
    condition: { type: String, enum: ['New', 'Good', 'Fair', 'Poor'], default: 'Good' },
    location: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Equipment', equipmentSchema);
