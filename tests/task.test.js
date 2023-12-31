const request = require('supertest');
const app = require('../src/app');

const { setupDatabase, userOne, userOneId } = require('./fixtures/db');
const Task = require('../src/models/tasks');
beforeEach(setupDatabase);
test('Should create task for user', async () => {
  const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'Test Task',
    })
    .expect(201);

  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();
  expect(task.completed).toEqual(false);
});
