const checkRole = (roles) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const hasRole = roles.includes(user.role);
    if (!hasRole) {
      return res.status(403).json({ message: "Forbidden: Access is denied" });
    }

    next();
  };
};

export default checkRole;
