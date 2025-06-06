import { Router } from "express";
import checkRole from "../../middlewares/checkRole.js";
import TokenService from "../../services/token.service.js";
import FailedUploadsController from "../../controllers/system/failedUploads.controller.js";

const router = Router();

router.get(
  "/",
  TokenService.checkAccess,
  checkRole(["Admin"]),
  FailedUploadsController.getAll
);

export default router;
