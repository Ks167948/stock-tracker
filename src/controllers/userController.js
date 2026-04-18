const User = require('../models/User');

// POST /api/users
const createUser = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.create({ name, email });
    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createUser, getUser, getAllUsers };