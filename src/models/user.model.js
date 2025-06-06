import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: false,
    trim: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ["Admin", "Manager", "Member"],
    default: "Member",
  },
  password: {
    type: String,
    required: true,
    trim: true,
    select: false,
  },
  avatar: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: true,
  },
  birthday: {
    type: Date,
    required: false,
  },
});

const User = mongoose.model("User", UserSchema);
export default User;
