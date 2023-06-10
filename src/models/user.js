const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const { INVALID_PASSWORDS } = require('../../utils/constants');
const Task = require('./tasks');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minLength: 1 },
    age: {
      type: Number,
      required: true,
      default: 0,
      validate(value) {
        if (value < 0) throw new Error('Age cannot be less than 0');
      },
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      required: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value))
          throw new Error('Invalid email provided');
      },
    },
    password: {
      type: String,
      trim: true,
      required: true,
      validate(value) {
        const lengthCheck = value.length > 6;
        const passwordCheck = !INVALID_PASSWORDS.some((invalid_keyword) =>
          value.toLowerCase().includes(invalid_keyword.toLowerCase())
        );
        if (![lengthCheck, passwordCheck].every((v) => v == true))
          throw new Error('Invalid password!!');
      },
    },
    avatar: {
      type: Buffer,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner',
});
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;
  return userObject;
};
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Unable to login');
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Unable to login');
  return user;
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});
const User = mongoose.model('User', userSchema);

module.exports = User;
