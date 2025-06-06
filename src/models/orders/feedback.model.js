import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["new", "inWork", "completed"],
      default: "new",
    },
    estateId: {
      type: String,
    },
    description: {
      type: String,
    },
    estateAgent: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "User",
    },
    title: {
      type: String,
    },
  },
  { timestamps: true }
);

const FeedbackModel = mongoose.model("Feedback", FeedbackSchema);
export default FeedbackModel;
