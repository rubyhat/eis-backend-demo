import FailedUploadLogModel from "../../models/failedUploadLog.model.js";

// todo: на фронтенде добавить вывод этих логов
/**
 * Контроллер для получения логов неудачных загрузок изображений
 */
class FailedUploadsController {
  /**
   * Получить все логи
   */
  static async getAll(req, res, next) {
    try {
      const logs = await FailedUploadLogModel.find()
        .sort({ createdAt: -1 })
        .limit(100);
      return res.status(200).json(logs);
    } catch (error) {
      console.error("Ошибка при получении логов загрузок:", error);
      next(error);
    }
  }
}

export default FailedUploadsController;
