const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const { userOne, userOneId, configDatabase } = require('./fixtures/db');

beforeEach(configDatabase);

test('can sign up a new user', async () => {
	const response = await request(app)
		.post('/users/signup')
		.send({
			email: 'medo@gmail.com',
			name: 'medo',
			password: '12345678'
		})
		.expect(201);

	// Assert that the user has been saved successfully to the database
	const user = await User.findById(response.body.user._id);
	expect(user).not.toBeNull();

	// Assertions about the response body
	// the response body object should contain the provided object properties
	expect(response.body).toMatchObject({
		user: {
			email: 'medo@gmail.com',
			name: 'medo'
		},
		token: user.tokens[0].token
	});

	// Assert that the password is not a plain text password
	expect(user.password).not.toBe('12345678');
});

test('can login existing users', async () => {
	const response = await request(app)
		.post('/users/login')
		.send({ email: userOne.email, password: userOne.password })
		.expect(200);

	// Assert that a new token is saved to database
	const user = await User.findById(userOneId);
	expect(response.body.token).toBe(user.tokens[1].token);
});

test('can not login non-existent user "invalid credentials"', async () => {
	await request(app)
		.post('/users/login')
		.send({ email: 'someemail@gmail.com', password: 'passcode' })
		.expect(400);
});

test('can get profile for user', async () => {
	await request(app)
		.get('/users/me')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);
});

test('can not get profile for unauthorized users', async () => {
	await request(app)
		.get('/users/me')
		.send()
		.expect(401);
});

test('can delete user acount', async () => {
	await request(app)
		.delete('/users/me')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200);

	// Assert that the user has been deleted from the database
	const user = await User.findById(userOneId);
	expect(user).toBeNull();
});

test('can not delete acount for unauthorized users', async () => {
	await request(app)
		.delete('/users/me')
		.send()
		.expect(401);
});

test('can upload an avatar image', async () => {
	await request(app)
		.post('/users/me/avatar')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.attach('avatar', 'tests/fixtures/profile-pic.jpg') // the root path
		.expect(200);

	const user = await User.findById(userOneId);
	expect(user.avatar).toEqual(expect.any(Buffer));
});

test("can update user's profile data", async () => {
	await request(app)
		.patch('/users/me')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({ name: 'medo' })
		.expect(200);

	const user = await User.findById(userOneId);
	expect(user.name).toBe('medo');
});

test('can not update invalid user fields', async () => {
	await request(app)
		.patch('/users/me')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({ location: 'anything' })
		.expect(400);
});
