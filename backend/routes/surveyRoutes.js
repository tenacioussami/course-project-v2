const express = require('express');
const router = express.Router();
const {
  getSurveys, getSurvey, createSurvey, updateSurvey, deleteSurvey, submitResponse, getResults,
} = require('../controllers/surveyController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public: anyone can view surveys and results
router.get('/', getSurveys);
router.get('/:id', getSurvey);
router.get('/:id/results', optionalAuth, getResults);

// Login required to create/edit/delete/respond
router.use(protect);
router.post('/', authorize('admin'), createSurvey);
router.put('/:id', authorize('admin'), updateSurvey);
router.delete('/:id', authorize('admin'), deleteSurvey);
router.post('/:id/responses', submitResponse);

module.exports = router;
