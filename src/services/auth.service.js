import {
  Conflict,
  Forbidden,
  NotFound,
  Unauthorized,
} from "../utils/Errors.js";
import UserModel from "../models/user.model.js";
import TokenService from "./token.service.js";
import TokenModel from "../models/token.model.js";
import { ACCESS_TOKEN_EXPIRATION } from "../constants.js";
import bcrypt from "bcrypt";
import { uploadToS3 } from "./uploader.service.js";

const roles = ["Member", "Manager", "Admin"];

class AuthService {
  static async login({ username, password, fingerprint }) {
    const userData = await UserModel.findOne({ username }).select("+password");

    if (!userData) {
      throw new NotFound("user_not_found");
    }

    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      throw new Unauthorized("wrong_password");
    }

    const payload = {
      id: userData._id,
      role: userData.role,
      name: userData.name,
      username: userData.username,
      phone: userData.phone,
      avatar: userData.avatar,
    };

    const accessToken = await TokenService.generateAccessToken(payload);
    const refreshToken = await TokenService.generateRefreshToken(payload);

    const deviceSession = await TokenModel.find({
      fingerprint: fingerprint.hash,
    });
    if (deviceSession) {
      await TokenModel.deleteOne({ fingerprint: fingerprint.hash });
    }

    // TODO: REFACTOR AUTH
    await TokenModel.create({
      user: userData._id,
      refreshToken,
      fingerprint: fingerprint.hash,
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiration: ACCESS_TOKEN_EXPIRATION,
    };
  }

  static async register(user) {
    const userData = await UserModel.findOne({ username: user.username });
    const userByEmail = await UserModel.findOne({ email: user.email });

    if (userByEmail) {
      throw new Conflict("email_already_exist");
    }

    if (userData) {
      throw new Conflict("user_already_exist");
    }
    let avatarUrl = "";
    if (user.avatar) {
      try {
        avatarUrl = await uploadToS3(user.avatar, "avatars");
      } catch (err) {
        console.log("Upload Error", err);
        throw new Error("upload_image_error");
      }
    }

    const hashedPassword = await bcrypt.hash(user.password, 3);
    const result = await UserModel.create({
      ...user,
      password: hashedPassword,
      avatar: avatarUrl,
    });

    const payload = {
      id: result._id,
      role: result.role,
      name: result.name,
      username: result.username,
      phone: result.phone,
      avatar: result.avatar,
    };

    const accessToken = await TokenService.generateAccessToken(payload);
    const refreshToken = await TokenService.generateRefreshToken(payload);

    // TODO: REFACTOR AUTH
    await TokenModel.create({
      user: result._id,
      refreshToken,
      fingerprint: user.fingerprint.hash,
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiration: ACCESS_TOKEN_EXPIRATION,
    };
  }

  static async update(userId, updatedUser, avatar, isAdmin) {
    const userData = await UserModel.findById(userId);
    const updatedData = { ...updatedUser };

    if (!userData) {
      throw new Conflict("user_is_not_exist");
    }

    if (updatedUser.password) {
      const hashedPassword = await bcrypt.hash(updatedUser.password, 3);
      updatedData.password = hashedPassword;
    }

    if (updatedUser.role) {
      const newRoleIndex = roles.findIndex((el) => el === updatedUser.role);
      const oldRoleIndex = roles.findIndex((el) => el === userData.role);
      if (!(newRoleIndex < oldRoleIndex || isAdmin)) {
        updatedData.role = userData.role;
      }
    }

    if (avatar) {
      try {
        const avatarUrl = await uploadToS3(avatar, "avatars");
        updatedData.avatar = avatarUrl;
      } catch (err) {
        console.log("Upload Error", err);
        throw new Error("upload_image_error");
      }
    }

    const updated = await UserModel.updateOne({ _id: userId }, updatedData);
    return updated;
  }

  static async logOut(refreshToken) {
    const tokenData = await TokenModel.deleteOne({ refreshToken });
    return tokenData;
  }

  static async refresh({ fingerprint, currentRefreshToken }) {
    if (!currentRefreshToken) {
      throw new Unauthorized();
    }

    const refreshSession = await TokenModel.findOne({
      refreshToken: currentRefreshToken,
    });

    if (!refreshSession) {
      throw new Unauthorized();
    }

    if (refreshSession.fingerprint !== fingerprint.hash) {
      console.log("ATTENTION DIFFERENT FINGERPRINTS");
      throw new Forbidden();
    }

    await refreshSession.deleteOne();

    let payload;
    try {
      payload = await TokenService.verifyRefreshToken(currentRefreshToken);
    } catch (error) {
      throw new Forbidden(error);
    }

    const userData = await UserModel.findOne({ username: payload.username });
    const actualPayload = {
      id: userData._id,
      name: userData.name,
      username: userData.username,
      role: userData.role,
      phone: userData.phone,
      avatar: userData.avatar,
    };

    const accessToken = await TokenService.generateAccessToken(actualPayload);
    const refreshToken = await TokenService.generateRefreshToken(actualPayload);

    await TokenModel.create({
      user: userData._id,
      refreshToken,
      fingerprint: fingerprint.hash,
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiration: ACCESS_TOKEN_EXPIRATION,
    };
  }
}

export default AuthService;
