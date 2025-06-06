import { uploadToS3 } from "../services/uploader.service.js";
import FailedUploadLogModel from "../models/failedUploadLog.model.js";

/**
 * Middleware для обработки изображений: ресайз, конвертация, загрузка в S3.
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {Function} next
 */
export const resizeAndUploadImagesMiddleware = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(); // Нет файлов — пропускаем
  }

  try {
    const uploadedImages = [];

    for (const file of req.files) {
      if (!file.mimetype.startsWith("image/")) {
        console.warn(`Файл с mime-типом ${file.mimetype} отклонён.`);
        continue; // Пропустить не-изображения
      }

      try {
        const imageUrl = await uploadToS3(file, "sell-orders");
        const thumbnailUrl = await uploadToS3(
          file,
          "sell-orders/thumbnails",
          400
        );

        if (imageUrl && thumbnailUrl) {
          uploadedImages.push({ imageUrl, thumbnailUrl });
        } else {
          await FailedUploadLogModel.create({
            originalName: file.originalname,
            reason: "S3 вернул null при загрузке",
            timestamp: new Date(),
          });
        }
      } catch (uploadError) {
        console.error("Ошибка загрузки файла:", file.originalname, uploadError);
        await FailedUploadLogModel.create({
          originalName: file.originalname,
          reason: uploadError.message,
          timestamp: new Date(),
        });
      }
    }

    req.body.images = uploadedImages;
    next();
  } catch (error) {
    console.error("Ошибка загрузки изображений:", error);
    return res.status(500).json({
      code: "IMAGE_UPLOAD_FAILED",
      message:
        "Произошла ошибка при загрузке изображений. Пожалуйста, попробуйте позже.",
    });
  }
};
