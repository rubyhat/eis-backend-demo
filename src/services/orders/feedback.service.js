import ObjectModel from "../../models/object.model.js";
import FeedbackModel from "../../models/orders/feedback.model.js";
import { NotFound } from "../../utils/Errors.js";
import { estateObjectDictionary } from "../../utils/EstateObjectDictionary.js";
import { TelegramService } from "../integrations/telegram.service.js";

const normalizeFeedbackOrderTitle = (estateObject) => {
  const roomCount = estateObject.roomCount
    ? `${estateObject.roomCount}-комн.`
    : "";
  const objectCategory = `${
    estateObjectDictionary.category[estateObject.category]
  }, `;
  const geo = estateObject.geoPosition;
  const objectFullAddress = `${geo.city ? geo.city + ", " : ""}${
    geo.street ? geo.street + ", " : ""
  }${geo.houseNumber ? geo.houseNumber : ""}`;

  const feedbackTitle = roomCount + objectCategory + objectFullAddress;

  return feedbackTitle;
};

const findFeedbackObject = async (id) => {
  const feedback = await FeedbackModel.findById(id).populate("estateAgent");

  if (!feedback) {
    throw new NotFound("feedback_is_not_exist");
  }

  return feedback;
};

// todo: create filters, create data validator, create error handler in  try/catch
export class FeedbackService {
  static async create(feedbackData) {
    const estateObject = await ObjectModel.findById(feedbackData.estateId);
    if (!estateObject) {
      throw new NotFound("estate_object_not_found");
    }

    const feedbackTitle = normalizeFeedbackOrderTitle(estateObject);
    const newFeedback = new FeedbackModel({
      ...feedbackData,
      title: feedbackTitle,
      estateAgent: estateObject.estateAgent._id,
    });

    const result = await newFeedback.save();

    // Отправляем уведомление в телеграм
    await TelegramService.sendBuyOrderNotification(result);
    return result;
  }

  static async update(feedbackData, id) {
    await findFeedbackObject(id);

    const estateObject = await ObjectModel.findById(feedbackData.estateId);
    if (!estateObject) {
      throw new NotFound("estate_object_not_found");
    }

    const feedbackTitle = normalizeFeedbackOrderTitle(estateObject);
    const result = await FeedbackModel.updateOne(
      { _id: id },
      { ...feedbackData, title: feedbackTitle }
    );

    return result;
  }

  static async getAllFeedbacks(queryParams) {
    const filter = { ...queryParams };

    if (!filter.status) {
      filter.status = { $in: ["new", "inWork"] };
    }

    const feedbacks = await FeedbackModel.find(filter)
      .populate("estateAgent")
      .sort({ createdAt: -1 });

    return feedbacks;
  }

  static async getFeedbackById(id) {
    try {
      return await findFeedbackObject(id);
    } catch (error) {
      console.error("getFeedbackById catch error", error);
      throw error;
    }
  }

  static async deleteFeedback(id) {
    try {
      await findFeedbackObject(id);
      const deletedFeedback = await FeedbackModel.findByIdAndDelete(id);
      return deletedFeedback;
    } catch (error) {
      console.error("deleteFeedback catch error", error);
      throw error;
    }
  }
}
