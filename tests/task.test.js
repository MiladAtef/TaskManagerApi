const request = require('supertest');
const app = require('../src/app');
const Task = require('../src/models/task');
const {
	userOne,
	userOneId,
	configDatabase,
	userTwo,
	userTwoId,
	taskOne
} = require('./fixtures/db');

beforeEach(configDatabase);

test('user can create a new task ', async () => {
	const response = await request(app)
		.post('/tasks')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({ description: 'hello little boy' })
		.expect(201);

	const task = await Task.findById(response.body._id);
	expect(task.description).toEqual('hello little boy');
	expect(task.completed).toEqual(false);
});

test('can fetch all user tasks ', async () => {
	const response = await request(app)
		.get('/tasks')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);

	expect(response.body.length).toEqual(2);
});

test('user can only delete his own tasks ', async () => {
	// taskOne belongs to userOne
	await request(app)
		.delete(`/tasks/${taskOne._id}`)
		.set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
		.send()
		.expect(404);

	// the task is still exist in the database
	const task = await Task.findById(taskOne._id);
	expect(task).not.toBeNull();
});
