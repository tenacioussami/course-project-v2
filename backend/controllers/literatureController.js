const Literature = require('../models/Literature');
const crudFactory = require('./crudFactory');

const crud = crudFactory(Literature, {
  searchFields: ['paperTitle', 'authors', 'journal'],
});

// DELETE /api/literature/:id
// Admins can delete any paper; members can delete the papers they added.
const remove = async (req, res, next) => {
  try {
    const item = await Literature.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });

    const isOwner = String(item.createdBy) === String(req.user._id);
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'You can only remove papers you added' });
    }

    await item.deleteOne();
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { ...crud, remove };