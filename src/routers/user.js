const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const router = new express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');

//=======================================================================
// AUTHENTICATION (SIGN UP - LOG IN - LOG OUT - LOG OUT OF ALL DEVICES )
//=======================================================================

router.post('/users/signup', async (req, res) => {
	try {
		const user = await User.findOne({ email: req.body.email });
		// if the user already exists
		if (user) {
			return res.status(422).send({ error: 'Email is in use' });
		}

		// if not, create new one
		const newUser = new User(req.body);
		await newUser.save();
		sendWelcomeEmail(newUser.email, newUser.name);
		const token = await newUser.generateAuthToken();
		res.status(201).send({ user: newUser, token });
	} catch (err) {
		res.status(400).send(err);
	}
});

router.post('/users/login', async (req, res) => {
	const { email, password } = req.body;

	try {
		// this is a custom method on the User Model
		const user = await User.findByCredentials(email, password);
		const token = await user.generateAuthToken();
		res.send({ user, token });
	} catch (err) {
		res.status(400).send({ error: 'Invalid email or password' });
	}
});

router.post('/users/logout', auth, async (req, res) => {
	const { user, token } = req;

	try {
		// removing the token from the tokens array
		user.tokens = user.tokens.filter(t => t.token !== token);
		await user.save();
		res.send();
	} catch (err) {
		res.status(500).send();
	}
});

router.post('/users/logoutall', auth, async (req, res) => {
	const { user } = req;

	try {
		// removing all the tokens from the tokens array
		user.tokens = [];
		await user.save();
		res.send();
	} catch (err) {
		res.status(500).send();
	}
});

//================================================================
// PROFILE (VIEW PROFILE - UPDATE USER ACCOUNT - DELETE ACCOUNT)
//================================================================
router
	.route('/users/me')
	.get(auth, async (req, res) => {
		res.send(req.user);
	})
	.patch(auth, async (req, res) => {
		const { user, body } = req;

		const updates = Object.keys(body);
		const allowedUpdates = ['name', 'email', 'password', 'age'];
		const isValidOperation = updates.every(update =>
			allowedUpdates.includes(update)
		);

		if (!isValidOperation) {
			return res.status(400).send({ error: 'Invalid updates' });
		}

		try {
			updates.forEach(update => (user[update] = body[update]));
			await user.save();

			res.send(user);
		} catch (err) {
			res.status(400).send(err);
		}
	})
	.delete(auth, async (req, res) => {
		try {
			await req.user.remove();
			sendCancelationEmail(req.user.email, req.user.name);
			res.send(req.user);
		} catch (err) {
			res.status(500).send(err);
		}
	});

//================================================================
//                 (UPLOAD - DELETE) AVATAR
//================================================================

const upload = multer({
	limits: {
		fileSize: 1000000 // in bytes (1000,000 = 1 mega)
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
			return cb(new Error('please upload an image'));
		}
		cb(undefined, true);
	}
});

router
	.route('/users/me/avatar')
	.post(
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
	)
	.delete(auth, async (req, res) => {
		try {
			if (!req.user.avatar) {
				return res.status(400).send();
			}
			req.user.avatar = undefined;
			await req.user.save();
			res.send();
		} catch (err) {
			res.status(500).send();
		}
	});

//================================================================
//                 FETCHING USER AVATAR
//================================================================

router.get('/users/:id/avatar', async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user || !user.avatar) {
			throw new Error();
		}
		res.set('Content-Type', 'image/png');
		res.send(user.avatar);
	} catch (err) {
		res.status(404).send();
	}
});
module.exports = router;
