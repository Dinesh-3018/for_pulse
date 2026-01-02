const jwt = require("jsonwebtoken");
const UserRepository = require("../repositories/UserRepository");
const { ApiError } = require("../middleware/errorHandler");

class AuthService {
  async register(userData) {
    const existingUser = await UserRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ApiError(400, "User already exists");
    }

    const user = await UserRepository.create(userData);
    return {
      user,
      token: this.generateToken(user.id),
    };
  }

  async login(user) {
    return {
      user,
      token: this.generateToken(user.id),
    };
  }

  generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return await UserRepository.findById(decoded.id);
    } catch (error) {
      throw new ApiError(401, "Unauthorized");
    }
  }
}

module.exports = new AuthService();
