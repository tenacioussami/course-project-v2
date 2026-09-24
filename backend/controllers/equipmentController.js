const Equipment = require('../models/Equipment');
const crudFactory = require('./crudFactory');
module.exports = crudFactory(Equipment, {
  searchFields: ['name', 'category', 'location'],
});
