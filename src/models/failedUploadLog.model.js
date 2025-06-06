import mongoose from "mongoose";

/**
 * Модель логирования ошибок при загрузке изображений
 */
const FailedUploadLogSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    reason: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const FailedUploadLogModel = mongoose.model(
  "FailedUploadLog",
  FailedUploadLogSchema
);
export default FailedUploadLogModel;
