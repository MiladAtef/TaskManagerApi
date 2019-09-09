const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: 'meladattef2017@gmail.com',
		subject: 'Welcome to Task Manager',
		text: `Welcome to the app ${name},
    Please let us know your feedback
    and how you get along with the app`
	});
};

const sendCancelationEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: 'meladattef2017@gmail.com',
		subject: 'Sorry to see you go',
		text: `Goodbye ${name},
    we hope to see you sometime in the future`
	});
};

module.exports = {
	sendWelcomeEmail,
	sendCancelationEmail
};
