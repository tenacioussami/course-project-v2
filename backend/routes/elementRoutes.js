const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, remove } = require('../controllers/elementController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { upload } = require('../utils/cloudinary');

// Public: anyone can view
router.get('/', getAll);
router.get('/:id', getOne);

// Login required to add/edit/delete
router.use(protect);
const elementUpload = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'file', maxCount: 1 }]);
router.post('/', elementUpload, create);
router.put('/:id', elementUpload, update);
router.delete('/:id', authorize('admin'), remove);

module.exports = router;
