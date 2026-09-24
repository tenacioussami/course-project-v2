const Project = require('../models/Project');

// There is a single Project document that holds Overview + About info.
// getOrCreate ensures one always exists.
const getOrCreateProject = async () => {
  let project = await Project.findOne();
  if (!project) {
    project = await Project.create({});
  }
  return project;
};

const getProject = async (req, res, next) => {
  try {
    const project = await getOrCreateProject();
    res.json(project);
  } catch (err) {
    next(err);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await getOrCreateProject();
    Object.assign(project, req.body, { updatedBy: req.user._id });
    await project.save();
    res.json(project);
  } catch (err) {
    next(err);
  }
};

module.exports = { getProject, updateProject };
