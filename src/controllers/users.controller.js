import UserModel from "../models/user.model.js";
import AuthService from "../services/auth.service.js";
import { Forbidden, NotFound } from "../utils/Errors.js";
import { deleteImageFromS3 } from "../services/uploader.service.js";

class UsersController {
  static async getAllUsers(req, res, next) {
    try {
      const users = await UserModel.find();
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  static async getUser(req, res, next) {
    try {
      const username = req.params.username;
      const userData = await UserModel.findOne({ username });
      res.status(200).json(userData);
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req, res, next) {
    try {
      const user = req.user;

      if (user.role !== "Admin" && user.id !== req.params.id) {
        throw new Forbidden("not_allowed");
      }

      const updated = await AuthService.update(
        req.params.id,
        req.body,
        req.file,
        user.role === "Admin"
      );
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req, res, next) {
    const currentUser = req.user;
    try {
      if (currentUser.role !== "Admin") {
        throw new Forbidden("not_allowed");
      }

      const user = await UserModel.findById(req.params.id);

      if (!user) {
        throw new NotFound("user_not_found");
      }

      if (user.avatar) {
        const imageKey = user.avatar.split("/").pop();
        await deleteImageFromS3(`avatars/${imageKey}`);
      }

      const deleted = await UserModel.deleteOne({ _id: req.params.id });
      res.status(200).json(deleted);
    } catch (error) {
      next(error);
    }
  }
}

export default UsersController;
