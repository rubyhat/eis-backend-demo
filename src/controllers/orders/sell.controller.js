import { SellOrderService } from "../../services/orders/sell.service.js";
import { NotFound } from "../../utils/Errors.js";

class SellOrderController {
  static async findOrder(id, isAdminService) {
    return await SellOrderService.getOrderById(id, isAdminService);
  }
  static async create(req, res, next) {
    try {
      const order = await SellOrderService.create(req.body);
      return res.status(201).json(order);
    } catch (error) {
      console.error("Ошибка в контроллере SellOrderController.create:", error);
      next(error);
    }
  }

  static async update(req, res, next) {
    console.log("Sell_Controller_LOG: 1");
    try {
      // todo: add images in update method
      const order = await SellOrderService.update(
        req.body,
        req.params.id,
        req.isAdminService
      );
      return res.status(201).json(order);
    } catch (error) {
      console.error("Ошибка в контроллере SellOrderController.update:", error);
      next(error);
    }
  }
  static async getAllOrders(req, res, next) {
    try {
      const orders = await SellOrderService.getAllOrders(
        req.query,
        req.isAdminService
      );
      return res.status(200).json(orders);
    } catch (error) {
      console.error(
        "Ошибка в контроллере SellOrderController.getAllOrders:",
        error
      );
      next(error);
    }
  }

  static async getOrderById(req, res, next) {
    try {
      const id = req.params.id;
      const order = await SellOrderController.findOrder(id, req.isAdminService);
      return res.status(200).json(order);
    } catch (error) {
      next(error);
    }
  }

  static async deleteOrderById(req, res, next) {
    try {
      const id = req.params.id;
      const deletedOrder = await SellOrderService.deleteOrderById(id);

      if (!deletedOrder) return res.status(404).json(new NotFound());

      return res.status(200).json(deletedOrder);
    } catch (error) {
      next(error);
    }
  }
}

export default SellOrderController;
