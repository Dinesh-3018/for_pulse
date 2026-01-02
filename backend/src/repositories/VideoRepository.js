const BaseRepository = require("./BaseRepository");
const Video = require("../models/Video");

class VideoRepository extends BaseRepository {
  constructor() {
    super(Video);
  }

  async findByStatus(userId, status) {
    return await this.findAll({ status }, userId);
  }

  async findBySensitivity(userId, sensitivityStatus) {
    return await this.findAll({ sensitivityStatus }, userId);
  }

  async search(userId, term) {
    const filter = {
      $or: [
        { title: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
      ],
    };
    return await this.findAll(filter, userId);
  }
}

module.exports = new VideoRepository();
