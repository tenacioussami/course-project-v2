const Message = require('../models/Message');

const getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find().populate('sender', 'name profileImage').sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    next(err);
  }
};

const createMessage = async (req, res, next) => {
  try {
    const message = await Message.create({
      sender: req.user._id,
      message: req.body.message,
      replyTo: req.body.replyTo || null,
    });
    const populated = await message.populate('sender', 'name profileImage');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (String(message.sender) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }
    await message.deleteOne();
    res.json({ message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMessages, createMessage, deleteMessage };
