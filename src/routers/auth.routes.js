import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";
import AuthValidator from "../validators/auth.validator.js";
import TokenService from "../services/token.service.js";
import checkRole from "../middlewares/checkRole.js";
import { upload } from "../services/uploader.service.js";

const router = Router();

router.post("/login", AuthValidator.login, AuthController.login);
router.post(
  "/register",
  TokenService.checkAccess,
  checkRole(["Admin"]),
  upload.single("avatar"),
  AuthValidator.register,
  AuthController.register
);
router.post("/logout", AuthValidator.logOut, AuthController.logOut);
router.post("/refresh", AuthValidator.refresh, AuthController.refresh);
router.get("/ping", (req, res) => {
  res.status(200).send("pong!");
});

export default router;
