class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return await this.model.create(data);
  }

  async findById(id, userId) {
    const query = { _id: id };
    if (userId) query.userId = userId;
    return await this.model.findOne(query);
  }

  async findOne(filter) {
    return await this.model.findOne(filter);
  }

  async update(id, userId, data) {
    const query = { _id: id };
    if (userId) query.userId = userId;
    return await this.model.findOneAndUpdate(query, data, { new: true });
  }

  async delete(id, userId) {
    const query = { _id: id };
    if (userId) query.userId = userId;
    return await this.model.findOneAndDelete(query);
  }

  async findAll(filter = {}, userId) {
    const query = { ...filter };
    if (userId) query.userId = userId;
    return await this.model.find(query).sort({ createdAt: -1 });
  }
}

module.exports = BaseRepository;
