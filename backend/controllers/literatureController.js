const Literature = require('../models/Literature');
const crudFactory = require('./crudFactory');
module.exports = crudFactory(Literature, {
  searchFields: ['paperTitle', 'authors', 'journal'],
});
