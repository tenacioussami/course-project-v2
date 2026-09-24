const express = require('express');
const router = express.Router();
const { getUsers, getUser, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { upload } = require('../utils/cloudinary');

// Public: anyone can view the member directory
router.get('/', getUsers);
router.get('/:id', getUser);

// Everything below requires login
router.use(protect);
router.post('/', authorize('admin'), createUser);
router.put('/:id', upload.single('profileImage'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
