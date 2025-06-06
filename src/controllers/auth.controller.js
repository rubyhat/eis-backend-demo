import { COOKIE_SETTINGS } from "../constants.js";
import AuthService from "../services/auth.service.js";
import ErrorsUtils from "../utils/Errors.js";

class AuthController {
  static async login(req, res) {
    const { fingerprint } = req;
    const { username, password } = req.body;
    try {
      const { accessToken, accessTokenExpiration, refreshToken } =
        await AuthService.login({
          username,
          password,
          fingerprint,
        });

      res.cookie("refreshToken", refreshToken, COOKIE_SETTINGS.REFRESH_TOKEN);

      return res.status(200).json({ accessToken, accessTokenExpiration });
    } catch (err) {
      return ErrorsUtils.catchError(res, err);
    }
  }

  static async register(req, res) {
    const { fingerprint } = req;
    const { email, password, role, username, name, phone, birthday } = req.body;
    try {
      const { accessToken, accessTokenExpiration, refreshToken } =
        await AuthService.register({
          email,
          password,
          username,
          name,
          phone,
          role,
          fingerprint,
          birthday,
          avatar: req.file,
        });

      res.cookie("refreshToken", refreshToken, COOKIE_SETTINGS.REFRESH_TOKEN);

      return res.status(200).json({ accessToken, accessTokenExpiration });
    } catch (err) {
      return ErrorsUtils.catchError(res, err);
    }
  }

  static async logOut(req, res) {
    const refreshToken = req.cookies.refreshToken;
    const { fingerprint } = req;
    try {
      await AuthService.logOut(refreshToken, fingerprint);
      res.clearCookie("refreshToken");
      return res.sendStatus(200);
    } catch (err) {
      return ErrorsUtils.catchError(res, err);
    }
  }

  static async refresh(req, res) {
    const { fingerprint } = req;
    const currentRefreshToken = req.cookies.refreshToken;
    try {
      const { accessToken, accessTokenExpiration, refreshToken } =
        await AuthService.refresh({ currentRefreshToken, fingerprint });
      res.cookie("refreshToken", refreshToken, COOKIE_SETTINGS.REFRESH_TOKEN);
      return res.status(200).json({ accessToken, accessTokenExpiration });
    } catch (err) {
      return ErrorsUtils.catchError(res, err);
    }
  }
}

export default AuthController;
