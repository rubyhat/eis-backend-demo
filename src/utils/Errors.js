export class WebError {
  constructor(status, error, message = "") {
    this.status = status;
    this.error = error;
    this.message = message;
  }
}

export class Unprocessable extends WebError {
  constructor(error) {
    super(422, error);
  }
}

export class Conflict extends WebError {
  constructor(error) {
    super(409, error);
  }
}

export class NotFound extends WebError {
  constructor(error, message = "Ресурс не найден.") {
    super(404, error, message);
  }
}

export class Forbidden extends WebError {
  constructor(error) {
    super(403, error);
  }
}

export class Unauthorized extends WebError {
  constructor(error, message = "Нет доступа") {
    super(401, error, message);
  }
}

export class BadRequest extends WebError {
  constructor(error) {
    super(400, error);
  }
}

class ErrorUtils {
  static catchError(res, error) {
    return res.status(error.status || 500).json(error);
  }
}

export default ErrorUtils;
