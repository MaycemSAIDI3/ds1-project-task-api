const User = require('../models/User');
const jwt = require('jsonwebtoken');

// El fonction hedhi tasna3 compte jdid.
async function register(req, res, next) {
  const { name, login, password } = req.body || {};

  // Netthabtou elli el champs el obligatoires houma textes.
  if (
    typeof name !== 'string' ||
    typeof login !== 'string' ||
    typeof password !== 'string'
  ) {
    return res.status(400).json({
      message: 'Name, login, and password must be provided as strings.',
    });
  }

  try {
    // Ne5dhou ken el champs elli na9blouhom.
    // El role dima user, ma ne5dhouhech mel requete.
    // El model User ya3mel hash lel password 9bal el sauvegarde.
    const user = await User.create({
      name,
      login,
      password,
      role: 'user',
    });

    // Nraj3ou ken el ma3loumet elli ynajmou yokhrjou lel client.
    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user._id,
        name: user.name,
        login: user.login,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    // MongoDB yrajja3 code 11000 ki el login deja mawjoud.
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Login is already in use.',
      });
    }

    // El model ythabet mel longueur w el champs obligatoires.
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Invalid registration data.',
        errors: Object.values(error.errors).map((item) => item.message),
      });
    }

    // Ay erreur okhra temchi lel gestionnaire mta3 erreurs.
    return next(error);
  }
}

// Netthabtou mel login w password bech na3tiw token.
async function login(req, res, next) {
  const { login: enteredLogin, password } = req.body || {};

  // El login w password lezemhom ykounou textes.
  if (
    typeof enteredLogin !== 'string' ||
    typeof password !== 'string' ||
    !enteredLogin.trim() ||
    !password
  ) {
    return res.status(400).json({
      message: 'Login and password are required as non-empty strings.',
    });
  }

  try {
    // El password ma yarja3ch par defaut.
    // Nesta3mlou select bech na9raw el hash lel comparaison.
    const user = await User.findOne({
      login: enteredLogin.trim().toLowerCase(),
    }).select('+password');

    // Nraj3ou nafs el message lel login wala password el ghalet.
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        message: 'Invalid login or password.',
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return next(new Error('JWT_SECRET is not configured.'));
    }

    // sub fih ID el user.
    // El token 3andou expiration w signature HS256.
    const token = jwt.sign({}, secret, {
      subject: user._id.toString(),
      algorithm: 'HS256',
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    });

    // Ma nraj3ouch el password wala el hash fel reponse.
    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        login: user.login,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// Nsaddrou el deux fonctions lel routes.
module.exports = { register, login };