import mongoose from "mongoose";

const TokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, default: false, ref: "User" },
  refreshToken: { type: String, required: true },
  fingerprint: { type: String, required: true },
});

const TokenModel = mongoose.model("Token", TokenSchema);
export default TokenModel;
