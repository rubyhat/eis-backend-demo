import jwt from "jsonwebtoken";
import { Forbidden, Unauthorized } from "../utils/Errors.js";

class TokenService {
  static async generateAccessToken(payload) {
    return await jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "7d",
    });
  }

  static async generateRefreshToken(payload) {
    return await jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "14d",
    });
  }

  static async checkAccess(req, _, next) {
    const bearer = req.headers.authorization;
    if (!bearer) {
      return next(
        new Unauthorized("token_not_found", "Не передан токен авторизации")
      );
    }

    const [, token] = bearer.split(" ");

    if (!token) {
      return next(
        new Unauthorized("token_not_found", "Не передан токен авторизации")
      );
    }

    try {
      req.user = await TokenService.verifyAccessToken(token);
    } catch (error) {
      return next(new Forbidden(error));
    }

    next();
  }
  static async verifyAccessToken(accessToken) {
    return await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  }

  static async verifyRefreshToken(refreshToken) {
    return await jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  }
}

export default TokenService;
