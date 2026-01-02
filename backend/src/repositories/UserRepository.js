const User = require("../models/User");

class UserRepository {
  async create(userData) {
    return await User.create(userData);
  }

  async findByEmail(email) {
    return await User.findOne({ email }).select("+password");
  }

  async findById(id) {
    return await User.findById(id);
  }
}

module.exports = new UserRepository();
