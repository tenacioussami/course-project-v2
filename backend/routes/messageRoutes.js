const express = require('express');
const router = express.Router();
const { getMessages, createMessage, deleteMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

// Public: anyone can read the chat
router.get('/', getMessages);

// Login required to post or delete
router.use(protect);
router.post('/', createMessage);
router.delete('/:id', deleteMessage);

module.exports = router;
