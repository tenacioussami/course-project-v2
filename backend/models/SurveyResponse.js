const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  answer: { type: mongoose.Schema.Types.Mixed, required: true },
});

const surveyResponseSchema = new mongoose.Schema(
  {
    survey: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true },
    respondent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [answerSchema],
  },
  { timestamps: true }
);

surveyResponseSchema.index({ survey: 1, respondent: 1 }, { unique: true });

module.exports = mongoose.model('SurveyResponse', surveyResponseSchema);
