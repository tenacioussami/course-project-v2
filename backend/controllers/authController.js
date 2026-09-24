const jwt = require('jsonwebtoken');
const User = require('../models/User');


const ALLOWED_EMAILS = [
  '2310717@iub.edu.bd',   
  '2331493@iub.edu.bd',
  '221132@iub.edu.bd',
  '2331270@iub.edu.bd',
  '2331694@iub.edu.bd',
];

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const sanitize = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profileImage: user.profileImage,
  studentId: user.studentId,
  department: user.department,
  skills: user.skills,
  bio: user.bio,
  github: user.github,
  linkedin: user.linkedin,
  researchGate: user.researchGate,
  createdAt: user.createdAt,
});

// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      return res.status(403).json({
        message: 'This email is not authorized to register for this project.',
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    // Only allow admin role assignment if no users exist yet (bootstrap) or by an existing admin
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : 'member';

    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' && userCount === 0 ? 'admin' : assignedRole,
    });

    res.status(201).json({
      user: sanitize(user),
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({
      user: sanitize(user),
      token: generateToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    res.json(sanitize(req.user));
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, sanitize };