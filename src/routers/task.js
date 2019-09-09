const express = require('express');
const router = new express.Router();
const Task = require('../models/task');
const auth = require('../middleware/auth');

//======================================================
//            (CREATE A TASK - FETCH TASKS)
//======================================================

router
	.route('/tasks')
	.post(auth, async (req, res) => {
		const task = new Task({ ...req.body, _user: req.user._id });
		try {
			await task.save();
			res.status(201).send(task);
		} catch (err) {
			res.status(400).send(err);
		}
	})
	.get(auth, async (req, res) => {
		const match = {};
		const sort = {};
		if (req.query.completed) {
			match.completed = req.query.completed === 'true';
		}

		// 1 for ascending sorting (get oldest first)
		// -1 for descending sorting (get newest first)
		if (req.query.sortBy) {
			const queryParts = req.query.sortBy.split(':'); // ['createdAt','asc/desc']
			sort[queryParts[0]] = queryParts[1] === 'desc' ? -1 : 1;
		}

		try {
			await req.user
				.populate({
					path: 'tasks',
					match,
					options: {
						limit: parseInt(req.query.limit),
						skip: parseInt(req.query.skip),
						sort
					}
				})
				.execPopulate();
			res.send(req.user.tasks);
		} catch (err) {
			res.status(500).send(err);
		}
	});

//======================================================
//         (FETCH - UPDATE - DELETE) A TASK
//======================================================

router
	.route('/tasks/:id')
	.get(auth, async (req, res) => {
		const _id = req.params.id;
		try {
			const task = await Task.findOne({ _id, _user: req.user._id });
			if (!task) {
				return res.status(404).send();
			}
			res.send(task);
		} catch (err) {
			res.status(500).send();
		}
	})
	.patch(auth, async (req, res) => {
		const _id = req.params.id;
		const updates = Object.keys(req.body);
		const allowedUpdates = ['description', 'completed'];
		const isValidOperation = updates.every(update =>
			allowedUpdates.includes(update)
		);

		if (!isValidOperation) {
			return res.status(400).send({ error: 'Invalid updates' });
		}

		try {
			const task = await Task.findOne({ _id, _user: req.user._id });

			if (!task) {
				return res.status(404).send();
			}

			updates.forEach(update => (task[update] = req.body[update]));
			await task.save();

			res.send(task);
		} catch (err) {
			res.status(400).send(err);
		}
	})
	.delete(auth, async (req, res) => {
		const _id = req.params.id;
		try {
			const task = await Task.findOneAndDelete({ _id, _user: req.user._id });
			if (!task) {
				return res.status(404).send();
			}
			res.send(task);
		} catch (err) {
			res.status(500).send(err);
		}
	});

module.exports = router;
