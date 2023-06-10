const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const { setupDatabase, userOne, userOneId } = require('./fixtures/db');
beforeEach(setupDatabase);

test('Should SignUp a new user', async () => {
  const response = await request(app)
    .post('/user')
    .send({
      name: 'Aryan',
      age: 24,
      email: 'aryan.khera@servian.com',
      password: 'passwagon@5544',
    })
    .expect(201);

  // Assert that user was created
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();
});

test('Should Login existing user', async () => {
  await request(app)
    .post('/user/login')
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);
});

test('Should not Login non-existent user', async () => {
  await request(app)
    .post('/user/login')
    .send({
      email: userOne.email,
      password: userOne.password + '..',
    })
    .expect(400);
});
test('Should get user profile', async () => {
  await request(app)
    .get('/user/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test('Should not get user profile for unauthenticated user', async () => {
  await request(app).get('/user/me').send().expect(401);
});

test('Should delete user profile', async () => {
  await request(app)
    .delete('/user/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  // Assert that user was deleted
  const user = await User.findById(userOne);
  expect(user).toBeNull();
});

test('Should not delete user profile for unauthenticated user', async () => {
  await request(app).delete('/user/me').send().expect(401);
});
