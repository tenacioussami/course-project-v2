const express = require('express');
const router = express.Router();
const { getProject, updateProject } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getProject); // public read is fine for an academic showcase; require login if you prefer
router.put('/', protect, updateProject);

module.exports = router;
