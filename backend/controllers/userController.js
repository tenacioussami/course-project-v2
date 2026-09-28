const User = require('../models/User');

const ROLES = ['admin', 'supervisor', 'member'];
const normalizeRole = (role) => String(role || '').trim().toLowerCase();

// Fields a user is allowed to change on a profile (never _id, password, timestamps)
const EDITABLE = ['name', 'studentId', 'department', 'skills', 'bio', 'github', 'linkedin', 'researchGate', 'profileImage'];

const isLastAdmin = async (userId) => {
  const target = await User.findById(userId).select('role').lean();
  if (!target || target.role !== 'admin') return false;
  const admins = await User.countDocuments({ role: 'admin' });
  return admins <= 1;
};

// GET /api/members — public directory
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
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

// Admin creates a member / supervisor / admin directly
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, studentId, department, skills, bio } = req.body;
    const cleanRole = normalizeRole(role) || 'member';
    if (!ROLES.includes(cleanRole)) {
      return res.status(400).json({ message: `Role must be one of: ${ROLES.join(', ')}` });
    }
    const existing = await User.findOne({ email: String(email || '').toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({
      name, email, password, role: cleanRole, studentId, department,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map((s) => s.trim()) : []),
      bio,
    });
    const { password: _pw, ...safe } = user.toObject();
    res.status(201).json(safe);
  } catch (err) {
    next(err);
  }
};

// PUT /api/members/:id — admin can edit anyone (including role); everyone else only themselves
const updateUser = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const isSelf = String(req.user._id) === String(req.params.id);
    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: 'You can only edit your own profile' });
    }

    const updates = {};
    EDITABLE.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });
    if (req.file) updates.profileImage = req.file.path;
    if (typeof updates.skills === 'string') {
      updates.skills = updates.skills.split(',').map((s) => s.trim()).filter(Boolean);
    }

    // Role change: admin only, must be a valid role, and never remove the last admin
    if (req.body.role !== undefined && isAdmin) {
      const newRole = normalizeRole(req.body.role);
      if (!ROLES.includes(newRole)) {
        return res.status(400).json({ message: `Role must be one of: ${ROLES.join(', ')}` });
      }
      if (newRole !== 'admin' && (await isLastAdmin(req.params.id))) {
        return res.status(400).json({ message: 'At least one admin is required. Make someone else admin first.' });
      }
      updates.role = newRole;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    if (await isLastAdmin(req.params.id)) {
      return res.status(400).json({ message: 'You cannot delete the only admin.' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Member deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser, ROLES };