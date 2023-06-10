const { default: mongoose } = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/user');
const userOneId = new mongoose.Types.ObjectId();
const userOne = {
  _id: userOneId,
  name: 'Josuke',
  age: 24,
  email: 'josuke@jojo.com',
  password: 'passwagon@5544',
  tokens: [
    {
      token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET),
    },
  ],
};
const setupDatabase = async () => {
  await User.deleteMany({});
  await new User(userOne).save();
};
module.exports = { userOneId, userOne, setupDatabase };
