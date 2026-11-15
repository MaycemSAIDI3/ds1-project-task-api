// Na9blou liste mta3 roles elli 3andhom el permission.
function authorize(...allowedRoles) {
  return function checkRole(req, res, next) {
    // authenticate lezem yet3adda 9bal el middleware hedha.
    if (!req.user) {
      res.set('WWW-Authenticate', 'Bearer');

      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    // El role ne5dhouh mel user elli authenticate jebou mel base.
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied. Insufficient permissions.',
      });
    }

    return next();
  };
}

module.exports = authorize;