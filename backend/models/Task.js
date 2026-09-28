const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
    startDate: { type: Date },
    deadline: { type: Date },
  },
  { timestamps: true }
);

// Indexes for the common sorts/filters (list page + dashboard deadlines)
taskSchema.index({ createdAt: -1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ status: 1 });

module.exports = mongoose.model('Task', taskSchema);
