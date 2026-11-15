const express = require('express');
const { register, login } = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

// El router yjamma3 el routes mta3 authentification.
const router = express.Router();

// Route mta3 creation compte.
router.post('/register', register);

// Route mta3 connexion w creation token JWT.
router.post('/login', login);

// El user lezem ykoun connecte bech ychouf profilou.
router.get('/me', authenticate, (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      login: req.user.login,
      role: req.user.role,
      createdAt: req.user.createdAt,
    },
  });
});

module.exports = router;