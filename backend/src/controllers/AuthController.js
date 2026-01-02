const AuthService = require("../services/AuthService");
const { ApiError } = require("../middleware/errorHandler");

const register = async (req, res, next) => {
  try {
    const { user, token } = await AuthService.register(req.body);
    res.status(201).json({
      status: "success",
      token,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, token } = await AuthService.login(req.user);
    res.status(200).json({
      status: "success",
      token,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: { user: req.user },
  });
};

module.exports = {
  register,
  login,
  getMe,
};
