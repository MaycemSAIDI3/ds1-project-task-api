const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Nraj3ou nafs el reponse ki el token ne9es wala ghalet.
function rejectAuthentication(res) {
  res.set('WWW-Authenticate', 'Bearer');

  return res.status(401).json({
    message: 'Authentication required. Token missing, invalid, or expired.',
  });
}

// Netthabtou mel token 9bal ma nkhalliw el requete tkammel.
async function authenticate(req, res, next) {
  const authorization = req.get('Authorization');

  // El header lezem ykoun: Bearer TOKEN.
  const match =
    typeof authorization === 'string'
      ? authorization.match(/^Bearer\s+(\S+)$/i)
      : null;

  if (!match) {
    return rejectAuthentication(res);
  }

  const secret = process.env.JWT_SECRET;

  // Secret ne9es ya3ni configuration el serveur moch kemla.
  if (!secret) {
    return next(new Error('JWT_SECRET is not configured.'));
  }

  let payload;

  try {
    // Netthabtou mel signature w expiration mta3 el token.
    payload = jwt.verify(match[1], secret, {
      algorithms: ['HS256'],
    });
  } catch {
    return rejectAuthentication(res);
  }

  // sub fih ID el user, w exp fih wa9t expiration.
  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.sub !== 'string' ||
    !/^[a-fA-F0-9]{24}$/.test(payload.sub) ||
    !Number.isFinite(payload.exp)
  ) {
    return rejectAuthentication(res);
  }

  try {
    // Na9raw el user w el role mte3ou mel base.
    const user = await User.findById(payload.sub);

    if (!user) {
      return rejectAuthentication(res);
    }

    // N7ottou el user fel requete bech nesta3mlouh mba3d.
    req.user = user;

    return next();
  } catch (error) {
    // Erreur el base temchi lel middleware mta3 erreurs.
    return next(error);
  }
}

module.exports = authenticate;