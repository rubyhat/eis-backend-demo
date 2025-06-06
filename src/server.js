import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import Fingerprint from "express-fingerprint";
import cookieParser from "cookie-parser";

import AuthRootRouter from "./routers/auth.routes.js";
import UsersRouter from "./routers/users.routes.js";
import ObjectsRouter from "./routers/objects.routes.js";
import FeedbacksRouter from "./routers/orders/feedbacks.routes.js";
import SellOrdersRouter from "./routers/orders/sell.routes.js";
import ErrorUtils, { WebError } from "./utils/Errors.js";
import { isAdminService } from "./middlewares/isClientSite.js";
import FailedUploadsRouter from "./routers/system/failedUploads.routes.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const API_VERSION = "/api/v1";

const app = express();

const corsOptions = {
  credentials: true, // Нужны, так как refreshToken в HTTP-only cookie
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://test.simpleweb.kz",
    "https://testing.simpleweb.kz",
  ],
};

app.options("*", cors(corsOptions)); // обработка preflight OPTIONS
app.use(cors(corsOptions)); // основной CORS

app.use(morgan("tiny"));
app.use(cookieParser());
app.use(express.json());

app.use(
  Fingerprint({
    parameters: [Fingerprint.acceptHeaders], // todo: тест почему отпечаток на клиенте меняется и рефреш метод возвращает 403
    // parameters: [Fingerprint.useragent, Fingerprint.acceptHeaders],
  })
);

app.use(isAdminService);

app.use(`${API_VERSION}/auth`, AuthRootRouter);
app.use(`${API_VERSION}/users`, UsersRouter);
app.use(`${API_VERSION}/catalog`, ObjectsRouter);

app.use(`${API_VERSION}/orders/feedback`, FeedbacksRouter);

// Обработчик для favicon.ico
app.get("/favicon.ico", (req, res) => res.status(204).end());
app.use(`${API_VERSION}/orders/sell`, SellOrdersRouter);
app.use(`${API_VERSION}/system/failed-uploads`, FailedUploadsRouter);

// Error handling middleware
app.use((err, req, res, _next) => {
  if (err instanceof WebError) {
    ErrorUtils.catchError(res, err);
  } else {
    console.error(err.stack);
    res.status(500).json({
      error: "internal_server_error",
      message: err.message,
    });
  }
});

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to the database");
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Устанавливаем таймаут на 15 минут (в миллисекундах)
    server.timeout = 15 * 60 * 1000; // 15 минут
  } catch (error) {
    console.log("FAILED Connection to the database", error);
  }
};

start();
