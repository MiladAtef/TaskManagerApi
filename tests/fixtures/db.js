const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../src/models/user');
const Task = require('../../src/models/task');

const userOneId = new mongoose.Types.ObjectId();
const userOne = {
	_id: userOneId,
	name: 'milad',
	email: 'milad@gmail.com',
	password: '12345678',
	tokens: [{ token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET) }]
};

const userTwoId = new mongoose.Types.ObjectId();
const userTwo = {
	_id: userTwoId,
	name: 'jessy',
	email: 'jessy@gmail.com',
	password: '12345678',
	tokens: [{ token: jwt.sign({ _id: userTwoId }, process.env.JWT_SECRET) }]
};

const taskOne = {
	_id: new mongoose.Types.ObjectId(),
	description: 'task one',
	completed: false,
	_user: userOneId
};

const taskTwo = {
	_id: new mongoose.Types.ObjectId(),
	description: 'task two',
	completed: true,
	_user: userOneId
};

const taskThree = {
	_id: new mongoose.Types.ObjectId(),
	description: 'task three',
	completed: false,
	_user: userTwoId
};

const configDatabase = async () => {
	await User.deleteMany();
	await Task.deleteMany();
	await new User(userOne).save();
	await new User(userTwo).save();
	await new Task(taskOne).save();
	await new Task(taskTwo).save();
	await new Task(taskThree).save();
};
module.exports = {
	userOneId,
	userOne,
	userTwoId,
	userTwo,
	taskOne,
	taskTwo,
	taskThree,
	configDatabase
};
