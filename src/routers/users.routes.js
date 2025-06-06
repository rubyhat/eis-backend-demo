import { Router } from "express";
import TokenService from "../services/token.service.js";
import UsersController from "../controllers/users.controller.js";
import checkRole from "../middlewares/checkRole.js";
import { upload } from "../services/uploader.service.js";

const router = Router();

router.get("/", TokenService.checkAccess, UsersController.getAllUsers);
router.get("/:username", TokenService.checkAccess, UsersController.getUser);
router.put(
  "/:id",
  TokenService.checkAccess,
  upload.single("avatar"),
  UsersController.updateUser
);
router.delete(
  "/:id",
  TokenService.checkAccess,
  checkRole(["Admin"]),
  UsersController.deleteUser
);

export default router;
