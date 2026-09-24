const Element = require('../models/Element');
const crudFactory = require('./crudFactory');
module.exports = crudFactory(Element, {
  searchFields: ['name', 'category'],
});
