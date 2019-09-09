const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Schema } = mongoose;
const Task = require('./task');

const userSchema = new Schema(
	{
		name: { type: String, required: true, trim: true },
		email: {
			type: String,
			unique: true,
			trim: true,
			lowercase: true,
			validate(v) {
				if (!validator.isEmail(v)) {
					throw new Error('you must provide a valid email');
				}
			}
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
			trim: true,
			validate(v) {
				if (v.toLowerCase().includes('password')) {
					throw new Error("you cannot contain the word 'password'");
				}
			}
		},
		tokens: [
			{
				token: {
					type: String,
					required: true
				}
			}
		],
		avatar: { type: Buffer }
	},
	{ timestamps: true }
);

// setup relationship between users and tasks
// the first argument 'tasks' is a name that we give to
// that virtual type
// the second argument is an options object, and in that object three props
// the first is the ref 'Task'
// the second is the localField, and in that case is the _id as we specified
// the relation in the Task Model {_user:{type:Schema.Types.ObjectId}}
// the third is the foreignField, and in that case is the _user as we specified
// the relation in the Task Model {_user:{type:Schema.Types.ObjectId}}
userSchema.virtual('tasks', {
	ref: 'Task',
	localField: '_id',
	foreignField: '_user'
});

// custom Model method (accessable via User)
userSchema.statics.findByCredentials = async (email, password) => {
	const user = await User.findOne({ email });

	if (!user) {
		throw new Error('Unable to login');
	}

	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		throw new Error('Unable to login');
	}

	return user;
};

// custom instance method (accessable via user)
userSchema.methods.generateAuthToken = async function() {
	const user = this;
	const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
	user.tokens = user.tokens.concat({ token });
	await user.save();
	return token;
};

// hashing passwords before saving (creating or editing users)
userSchema.pre('save', async function(next) {
	const user = this;

	if (user.isModified('password')) {
		const hash = await bcrypt.hash(user.password, 8);
		user.password = hash;
	}
	next();
});

// remove all user tasks when the user is removed
userSchema.pre('remove', async function(next) {
	const user = this;
	await Task.deleteMany({ _user: user._id });
	next();
});

// to hide the password and the tokens from the returned response user object
userSchema.methods.toJSON = function() {
	const user = this;
	const userObject = user.toObject();

	delete userObject.password;
	delete userObject.tokens;
	delete userObject.avatar;

	return userObject;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
