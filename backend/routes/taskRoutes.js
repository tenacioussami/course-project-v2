const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public: anyone can view tasks
router.get('/', getTasks);
router.get('/:id', getTask);

// Everything below requires login
router.use(protect);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', authorize('admin'), deleteTask);

module.exports = router;
