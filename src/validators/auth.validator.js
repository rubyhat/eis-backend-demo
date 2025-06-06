import validateRequest from "../utils/ValidateRequest.js";
import * as Yup from "yup";

const phoneRegExp = /^\+?[1-9]\d{10}$/;

export const loginSchema = Yup.object({
  body: Yup.object({
    username: Yup.string()
      .required("required_field")
      .max(25, "Максимальная длина - 25 символов"),
    password: Yup.string()
      .required("required_field")
      .min(3, "Пароль слишком короткий - минимум 3 символа")
      .max(50, "Максимальная длина - 50 символов"),
  }),
});

export const registerSchema = Yup.object({
  body: Yup.object({
    email: Yup.string().email().required("required_field"),
    password: Yup.string()
      .required("required_field")
      .min(3, "Пароль слишком короткий - минимум 3 символа")
      .max(50, "Максимальная длина - 50 символов"),
    role: Yup.string().oneOf(["Admin", "Manager", "Member"]),
    name: Yup.string().required(),
    username: Yup.string().required(),
    phone: Yup.string().matches(phoneRegExp, "phone_invalid"),
  }),
});

export const logoutSchema = Yup.object({
  cookies: Yup.object({
    refreshToken: Yup.string().required("Поле обязательно!"),
  }),
});

class AuthValidator {
  static async login(req, res, next) {
    return validateRequest(req, res, next, loginSchema);
  }

  static async register(req, res, next) {
    return validateRequest(req, res, next, registerSchema);
  }

  static async logOut(req, res, next) {
    return validateRequest(req, res, next, logoutSchema);
  }

  static async refresh(req, res, next) {
    return validateRequest(req, res, next);
  }
}

export default AuthValidator;
