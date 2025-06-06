import mongoose from "mongoose";
import commonObjectFields from "./shared/commonObjectFields.js";
import {
  DealTypeEnum,
  BusinessTypeEnum,
  VisibilityStatusEnum,
} from "@estate-information-system/shared-types";

const ObjectSchema = new mongoose.Schema(
  {
    ...commonObjectFields,
    type: {
      type: String,
      enum: Object.values(DealTypeEnum),
      required: true,
    },
    businessType: {
      type: String,
      enum: Object.values(BusinessTypeEnum),
    },
    visibilityStatus: {
      type: String,
      default: VisibilityStatusEnum.Checking,
      enum: Object.values(VisibilityStatusEnum),
    },
  },
  { timestamps: true }
);

ObjectSchema.index({ "geoPosition.street": 1 });

const ObjectModel = mongoose.model("Object", ObjectSchema);
export default ObjectModel;
