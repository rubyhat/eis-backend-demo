import { Router } from "express";
import FeedbacksController from "../../controllers/orders/feedbacks.controller.js";
import TokenService from "../../services/token.service.js";
import checkRole from "../../middlewares/checkRole.js";

const router = Router();

router.get("/", FeedbacksController.getAllFeedbacks);

// todo: подумать над мидлваре для защиты от фрода/спама
router.post("/", FeedbacksController.create);
router.put("/:id", TokenService.checkAccess, FeedbacksController.update);

router.delete(
  "/:id",
  TokenService.checkAccess,
  checkRole(["Admin", "Manager"]),
  FeedbacksController.delete
);

export default router;
