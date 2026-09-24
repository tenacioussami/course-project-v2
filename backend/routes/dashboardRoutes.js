const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');

// Public: project-wide stats, no login required
router.get('/', getDashboard);

module.exports = router;
