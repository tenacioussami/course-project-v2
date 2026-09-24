const Paper = require('../models/Paper');
const crudFactory = require('./crudFactory');
module.exports = crudFactory(Paper, {
  searchFields: ['title', 'authors', 'keywords'],
});
