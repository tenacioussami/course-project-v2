const User = require('../models/User');
const Task = require('../models/Task');
const Literature = require('../models/Literature');
const Equipment = require('../models/Equipment');
const Paper = require('../models/Paper');
const Message = require('../models/Message');
const Project = require('../models/Project');

const getDashboard = async (req, res, next) => {
  try {
    const [
      totalMembers,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      totalLiterature,
      totalEquipment,
      totalPapers,
      recentMessages,
      upcomingDeadlines,
      project,
    ] = await Promise.all([
      User.countDocuments(),
      Task.countDocuments(),
      Task.countDocuments({ status: 'Completed' }),
      Task.countDocuments({ status: 'Pending' }),
      Task.countDocuments({ status: 'In Progress' }),
      Literature.countDocuments(),
      Equipment.countDocuments(),
      Paper.countDocuments(),
      Message.find().populate('sender', 'name').sort({ createdAt: -1 }).limit(5),
      Task.find({ deadline: { $gte: new Date() } }).sort({ deadline: 1 }).limit(5).populate('assignedTo', 'name'),
      Project.findOne(),
    ]);

    res.json({
      totalMembers,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      totalLiterature,
      totalEquipment,
      totalDocuments: totalLiterature + totalPapers,
      projectProgress: project ? project.progress : 0,
      recentMessages,
      upcomingDeadlines,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
