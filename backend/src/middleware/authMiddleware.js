const AuthService = require("../services/AuthService");
const { ApiError } = require("./errorHandler");

const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      throw new ApiError(
        401,
        "You are not logged in! Please log in to get access."
      );
    }

    const currentUser = await AuthService.verifyToken(token);
    if (!currentUser) {
      throw new ApiError(
        401,
        "The user belonging to this token no longer exists."
      );
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, "You do not have permission to perform this action")
      );
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
