const express = require('express');
const User = require('../models/user');
const { default: mongoose } = require('mongoose');
const auth = require('../middleware/auth');
const Task = require('../models/tasks');
const multer = require('multer');
const sharp = require('sharp');
const router = new express.Router();

router.post('/user', async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (err) {
    console.error('Unable to add user, Error: ' + err);
    res.status(400).send({ error: 'Unable to add user', msg: err.message });
  }
});
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/))
      return cb(new Error('Supported file types: .jpg,.jpeg,.png'));
    cb(undefined, true);
  },
});
router.post(
  '/user/me/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);
router.delete('/user/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send();
});
router.get('/user/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) throw new Error();
    res.set('Content-type', 'image/png');
    res.send(user.avatar);
  } catch (err) {
    res.status(404).send('Unable to find avatar');
  }
});
router.post('/user/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token != req.token;
    });
    await req.user.save();
    res.send({ msg: 'Logged Out Successfully!!' });
  } catch (err) {
    res.status(500).send();
  }
});
router.post('/user/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send({ msg: 'Logged Out from all sessions Successfully!!' });
  } catch (err) {
    res.status(500).send();
  }
});
router.post('/user/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.get('/user/me', auth, async (req, res) => {
  res.send(req.user);
});
router.patch('/user/me', auth, async (req, res) => {
  const updatesAllowed = ['name', 'age', 'email', 'password'];
  const isValidOperation = Object.keys(req.body).every((update) =>
    updatesAllowed.includes(update)
  );
  if (!isValidOperation)
    return res.status(400).send({ error: 'Invalid update operation' });
  const _id = req.user._id;
  if (!mongoose.isObjectIdOrHexString(_id)) return res.status(404).send();
  else {
    try {
      Object.keys(req.body).forEach((update) => {
        req.user[update] = req.body[update];
      });
      await req.user.save();
      res.send(req.user);
    } catch (err) {
      console.log(err);
      res.status(500).send(err.message);
    }
  }
});
router.delete('/user/me', auth, async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.user._id });
    await Task.deleteMany({ owner: req.user._id });
    res.send(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
