import { Router } from "express";
import SellOrderController from "../../controllers/orders/sell.controller.js";
import TokenService from "../../services/token.service.js";
import checkRole from "../../middlewares/checkRole.js";
import { upload } from "../../services/uploader.service.js";
import { resizeAndUploadImagesMiddleware } from "../../middlewares/images.middleware.js"; // мы создадим это

const router = Router();

router.get("/", SellOrderController.getAllOrders);
router.get(
  "/:id",
  TokenService.checkAccess,
  checkRole(["Admin"]),
  SellOrderController.getOrderById
);

// todo: подумать над мидлваре для защиты от фрода/спама
router.post(
  "/",
  upload.array("images", 10),
  resizeAndUploadImagesMiddleware,
  SellOrderController.create
);
router.patch("/:id", TokenService.checkAccess, SellOrderController.update);

router.delete(
  "/:id",
  TokenService.checkAccess,
  checkRole(["Admin"]),
  SellOrderController.deleteOrderById
);

export default router;
