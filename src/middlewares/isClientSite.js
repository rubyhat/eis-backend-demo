export const isAdminService = (req, res, next) => {
  const isAdminService = req.headers["x-service-id"] === "admin";
  req.isAdminService = isAdminService;
  next();
};
