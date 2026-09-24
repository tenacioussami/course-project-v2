const User = require('../models/User');

// GET /api/users  (admin: all users, member: view-only list)
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Admin creates a member directly
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, studentId, department, skills, bio } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({
      name, email, password, role: role || 'member', studentId, department,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
      bio,
    });
    const { password: _pw, ...safe } = user.toObject();
    res.status(201).json(safe);
  } catch (err) {
    next(err);
  }
};

// Admin edits any user; a member may edit their own profile (checked in route)
const updateUser = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.password; // password change should go through a dedicated flow
    if (req.file) updates.profileImage = req.file.path;
    if (updates.skills && typeof updates.skills === 'string') {
      updates.skills = updates.skills.split(',').map((s) => s.trim());
    }
    // Only admin can change role
    if (req.user.role !== 'admin') delete updates.role;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser };
