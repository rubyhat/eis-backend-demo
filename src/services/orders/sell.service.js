import SellOrderModel from "../../models/orders/sell.model.js";
import { Conflict, NotFound } from "../../utils/Errors.js";
import { ObjectsService } from "../objects.service.js";
import { deleteImageFromS3 } from "../uploader.service.js";
import { TelegramService } from "../integrations/telegram.service.js";

const ownerInfoValues =
  "+ownerInfo.ownerName +ownerInfo.ownerPhone +ownerInfo.description +ownerInfo.apartmentNumber +ownerInfo.entranceNumber +ownerInfo.intercomNumber";

export class SellOrderService {
  static async findOrder(id, isAdminService) {
    const originalOrder = await SellOrderModel.findById(id)
      .select(isAdminService ? ownerInfoValues : "")
      .populate("estateAgent");

    if (!originalOrder) {
      throw new NotFound(
        "SELL_ORDER_NOT_FOUND",
        "Заявка с указанным идентификатором не найдена."
      );
    }

    return originalOrder;
  }
  static async parseOrderData(orderData) {
    const fullOrderData = {};

    try {
      if (orderData.geoPosition) {
        fullOrderData.geoPosition = JSON.parse(orderData.geoPosition);
      }
    } catch (error) {
      console.error("Error parsing geoPosition: ", error);
      throw new Conflict("Invalid geoPosition format");
    }

    try {
      if (orderData.ownerInfo) {
        fullOrderData.ownerInfo = JSON.parse(orderData.ownerInfo);
      }
    } catch (error) {
      console.error("Error parsing ownerInfo: ", error);
      throw new Conflict("Invalid ownerInfo format");
    }

    // здесь нет обязательных полей, поэтому ошибку выкидывать не нужно
    if (orderData.apartmentComplex) {
      fullOrderData.apartmentComplex = JSON.parse(orderData.apartmentComplex);
    }

    return fullOrderData;
  }

  static async create(orderData) {
    const fullOrderData = {
      ...orderData,
      ...(await this.parseOrderData(orderData)),
    };

    if (orderData.images) {
      fullOrderData.images = orderData.images;
    }

    if (orderData.geoPosition) {
      const geo = JSON.parse(orderData.geoPosition);
      fullOrderData.geoPosition = geo;
    }

    if (orderData.ownerInfo) {
      const owner = JSON.parse(orderData.ownerInfo);
      fullOrderData.ownerInfo = owner;
    }

    if (orderData.apartmentComplex) {
      const apartmentComplex = JSON.parse(orderData.apartmentComplex);
      fullOrderData.apartmentComplex = apartmentComplex;
    }

    const newOrder = new SellOrderModel(fullOrderData);
    await newOrder.save();

    // Отправляем уведомление в Телеграм
    await TelegramService.sendSellOrderNotification(newOrder);

    return newOrder;
  }

  static async update(orderData, id, isAdminService = false) {
    const existingOrder = await this.findOrder(id, isAdminService);

    const fullOrderData = {
      ...orderData,
      ...(await this.parseOrderData(orderData)),
    };

    let newObjectId = null;
    // Проверяем, если статус изменился на COMPLETED и объект ещё не был создан
    if (
      existingOrder.status !== "COMPLETED" &&
      fullOrderData.status === "COMPLETED"
    ) {
      // Создаём объект недвижимости
      console.log("==== existingOrder ====", existingOrder);
      const newObject =
        await ObjectsService.createObjectFromSellOrder(existingOrder);
      newObjectId = newObject._id;
      fullOrderData.createdObjectId = newObject._id;
    }

    if (orderData.geoPosition) {
      const geo = JSON.parse(orderData.geoPosition);
      fullOrderData.geoPosition = geo;
    }

    if (orderData.ownerInfo) {
      const owner = JSON.parse(orderData.ownerInfo);
      fullOrderData.ownerInfo = owner;
    }

    if (orderData.apartmentComplex) {
      const apartmentComplex = JSON.parse(orderData.apartmentComplex);
      fullOrderData.apartmentComplex = apartmentComplex;
    }

    // todo: handle edit existing images

    // Обновляем объект и возвращаем его с новыми данными
    const updatedOrder = await SellOrderModel.findByIdAndUpdate(
      id,
      fullOrderData,
      { new: true }
    ).populate("estateAgent"); // Выполняем популяцию агента

    if (!updatedOrder) {
      throw new NotFound(
        "SELL_ORDER_NOT_FOUND",
        "Заявка с указанным идентификатором не найдена."
      );
    }

    // Возвращаем чистый объект с добавленным `createdObjectId`
    return {
      ...updatedOrder.toObject(), // ✅ Убираем служебные данные Mongoose
      createdObjectId: newObjectId,
    };
  }

  static async getAllOrders(queryParams, isAdminService) {
    const allowedParams = ["status"];

    const { status, ...params } = queryParams;

    const filter = Object.keys(params).reduce((acc, key) => {
      if (allowedParams.includes(key)) {
        acc[key] = params[key];
      }
      return acc;
    }, {});

    if (status) {
      filter.status = status;
    }

    const SellOrders = await SellOrderModel.find(filter)
      .select(isAdminService ? ownerInfoValues : "")
      .populate("estateAgent")
      .sort({ createdAt: -1 });

    return SellOrders;
  }

  static async getOrderById(id, isAdminService) {
    try {
      const originalOrder = await this.findOrder(id, isAdminService);
      return originalOrder;
    } catch (error) {
      console.log("get sell order by id error: ", error);
      throw error;
    }
  }

  static async deleteOrderById(id) {
    try {
      const sellOrder = await SellOrderModel.findById(id);

      if (!sellOrder) {
        throw new NotFound(
          "SELL_ORDER_NOT_FOUND",
          "Заявка с указанным идентификатором не найдена."
        );
      }

      if (sellOrder.images.length > 0) {
        for (const image of sellOrder.images) {
          const imageKey = image.imageUrl.split(
            "https://eis-media.object.pscloud.io/"
          )[1];
          const thumbKey = image.thumbnailUrl.split(
            "https://eis-media.object.pscloud.io/"
          )[1];
          try {
            await deleteImageFromS3(imageKey);
            await deleteImageFromS3(thumbKey);
          } catch (err) {
            console.error("Ошибка при удалении изображений из S3:", err);
          }
        }
      }

      const deleteSellOrder = await SellOrderModel.findByIdAndDelete(id);
      return deleteSellOrder;
    } catch (error) {
      console.error("deleteSellOrder catch error:", error);
      throw error;
    }
  }
}
