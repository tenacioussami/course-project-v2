const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, remove } = require('../controllers/literatureController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../utils/cloudinary');

// Public: anyone can view
router.get('/', getAll);
router.get('/:id', getOne);

// Login required to add/edit/delete
router.use(protect);
router.post('/', upload.single('pdf'), create);
router.put('/:id', upload.single('pdf'), update);
// Admin: any paper · Member: only papers they added (checked in the controller)
router.delete('/:id', remove);

module.exports = router;