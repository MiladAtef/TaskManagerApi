const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const app = express();
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

mongoose
	.connect(process.env.MONGODB_URL, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false
	})
	.then(() => console.log('MongoDB Connection Succeeded.'))
	.catch(err => console.log('Error in DB connection: ' + err));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));

//ROUTERS
app.use(userRouter);
app.use(taskRouter);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`App listening on port ${PORT}`));
