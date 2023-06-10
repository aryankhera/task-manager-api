const express = require('express');
const router = new express.Router();
const auth = require('../middleware/auth');
const { default: mongoose } = require('mongoose');
const Task = require('../models/tasks');
const User = require('../models/user');
router.post('/tasks', auth, async (req, res) => {
  const task = new Task({ ...req.body, owner: req.user._id });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (err) {
    console.error('Unable to add task, Error: ' + err);
    res.status(400).send({ error: 'Unable to add task', msg: err.message });
  }
});
router.get('/tasks', auth, async (req, res) => {
  try {
    const match = {};
    if (req.query.completed) {
      match['completed'] = req.query.completed === 'true';
    }
    const sortBy = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sortBy[parts[0]] = parts[1] == 'desc' ? -1 : 1;
    }
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort: sortBy,
      },
    });
    res.send(req.user.tasks);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});
router.get('/task/:id', auth, async (req, res) => {
  const _id = req.params.id;
  if (!mongoose.isObjectIdOrHexString(_id)) return res.status(404).send();
  else {
    try {
      const task = await Task.findOne({ _id, owner: req.user._id });
      if (!task) return res.status(404).send();
      res.send(task);
    } catch (err) {
      console.log(err);
      res.status(500).send(err.message);
    }
  }
});

router.patch('/task/:id', auth, async (req, res) => {
  const updatesAllowed = ['completed', 'description'];
  const isValidOperation = Object.keys(req.body).every((update) =>
    updatesAllowed.includes(update)
  );
  if (!isValidOperation)
    return res.status(400).send({ error: 'Invalid update operation' });
  const _id = req.params.id;
  if (!mongoose.isObjectIdOrHexString(_id)) return res.status(404).send();
  else {
    try {
      const task = await Task.findOne({ _id, owner: req.user._id });
      if (!task) return res.status(404).send();
      Object.keys(req.body).forEach((update) => {
        task[update] = req.body[update];
      });
      await task.save();
      res.send(task);
    } catch (err) {
      console.log(err);
      res.status(500).send(err.message);
    }
  }
});
router.delete('/task/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!task) return res.status(404).send();
    res.send(task);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
module.exports = router;
