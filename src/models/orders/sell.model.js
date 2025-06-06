import mongoose from "mongoose";
import { SellOrderStatusEnum } from "@estate-information-system/shared-types";

import commonObjectFields from "../shared/commonObjectFields.js";

const SellOrderSchema = new mongoose.Schema(
  {
    ...commonObjectFields,
    status: {
      type: String,
      enum: Object.values(SellOrderStatusEnum),
      default: SellOrderStatusEnum.NEW,
    },
    declineReason: {
      type: String,
      default: null,
    },
    createdObjectId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const SellOrderModel = mongoose.model("SellOrder", SellOrderSchema);
export default SellOrderModel;
