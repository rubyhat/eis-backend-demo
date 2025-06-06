import { FeedbackService } from "../../services/orders/feedback.service.js";
import { NotFound } from "../../utils/Errors.js";

class FeedbacksController {
  static async create(req, res, next) {
    try {
      const feedback = await FeedbackService.create(req.body);
      return res.status(201).json({ feedback });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const feedback = await FeedbackService.update(req.body, req.params.id);
      return res.status(201).json({ feedback });
    } catch (error) {
      next(error);
    }
  }

  static async getAllFeedbacks(req, res, next) {
    try {
      const feedbacks = await FeedbackService.getAllFeedbacks(req.query);
      return res.status(200).json({ data: feedbacks });
    } catch (error) {
      next(error);
    }
  }

  static async getFeedbackById(req, res, next) {
    try {
      const id = req.params.id;
      const feedback = await FeedbackService.getObjectById(id);
      return res.status(200).json(feedback);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const id = req.params.id;
      const deletedFeedback = FeedbackService.deleteFeedback(id);
      if (!deletedFeedback) {
        return res.status(404).json(new NotFound());
      }
      return res.status(200).json(deletedFeedback);
    } catch (error) {
      next(error);
    }
  }
}

export default FeedbacksController;
