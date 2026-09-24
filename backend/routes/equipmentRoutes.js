const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, remove } = require('../controllers/equipmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { upload } = require('../utils/cloudinary');

// Public: anyone can view
router.get('/', getAll);
router.get('/:id', getOne);

// Login required to add/edit/delete
router.use(protect);
router.post('/', upload.single('image'), create);
router.put('/:id', upload.single('image'), update);
router.delete('/:id', authorize('admin'), remove);

module.exports = router;
