import { Router } from "express";
import ObjectsController from "../controllers/objects.controller.js";
import TokenService from "../services/token.service.js";
import checkRole from "../middlewares/checkRole.js";
import { upload } from "../services/uploader.service.js";

const router = Router();
const MAX_IMAGES = 30;

router.get("/", ObjectsController.getAllObjects);
router.get("/:id", ObjectsController.getObjectById);

router.post(
  "/",
  TokenService.checkAccess,
  upload.array("images", MAX_IMAGES),
  ObjectsController.create
);
router.put(
  "/:id",
  TokenService.checkAccess,
  upload.array("images", MAX_IMAGES),
  ObjectsController.update
);

router.delete(
  "/:id",
  TokenService.checkAccess,
  checkRole(["Admin", "Manager"]),
  ObjectsController.delete
);

export default router;
