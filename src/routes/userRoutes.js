const express = require('express');
const router = express.Router();
const { createUser, getUser, getAllUsers } = require('../controllers/userController');

router.get('/',     getAllUsers);
router.post('/',    createUser);
router.get('/:id',  getUser);

module.exports = router;