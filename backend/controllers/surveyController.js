const Survey = require('../models/Survey');
const SurveyResponse = require('../models/SurveyResponse');

const getSurveys = async (req, res, next) => {
  try {
    const surveys = await Survey.find().populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json(surveys);
  } catch (err) {
    next(err);
  }
};

const getSurvey = async (req, res, next) => {
  try {
    const survey = await Survey.findById(req.params.id).populate('createdBy', 'name');
    if (!survey) return res.status(404).json({ message: 'Survey not found' });
    res.json(survey);
  } catch (err) {
    next(err);
  }
};

const createSurvey = async (req, res, next) => {
  try {
    const survey = await Survey.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(survey);
  } catch (err) {
    next(err);
  }
};

const updateSurvey = async (req, res, next) => {
  try {
    const survey = await Survey.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!survey) return res.status(404).json({ message: 'Survey not found' });
    res.json(survey);
  } catch (err) {
    next(err);
  }
};

const deleteSurvey = async (req, res, next) => {
  try {
    const survey = await Survey.findByIdAndDelete(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Survey not found' });
    await SurveyResponse.deleteMany({ survey: survey._id });
    res.json({ message: 'Survey deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Submit a response
const submitResponse = async (req, res, next) => {
  try {
    const { answers } = req.body;
    const response = await SurveyResponse.findOneAndUpdate(
      { survey: req.params.id, respondent: req.user._id },
      { answers },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
};

// Get results (aggregated) for a survey
const getResults = async (req, res, next) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Survey not found' });
    if (!survey.resultsVisibleToMembers && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Results are not visible to members for this survey' });
    }
    const responses = await SurveyResponse.find({ survey: req.params.id }).populate('respondent', 'name');
    res.json({ survey, responses });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSurveys, getSurvey, createSurvey, updateSurvey, deleteSurvey, submitResponse, getResults };
