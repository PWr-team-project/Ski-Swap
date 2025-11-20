const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Booking = require('../models/Booking');
const BookingStatus = require('../models/BookingStatus');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Listing = require('../models/Listing');
const { auth } = require('../middleware/auth');

// TODO: Replace with real credentials
const transporter = nodemailer.createTransport({
	host: "smtp.ethereal.email",
	port: 587,
	secure: false, // true for 465, false for other ports
	auth: {
		user: "maddison53@ethereal.email",
		pass: "jn7jnAPss4f63QBp6D",
	},
});

// Send booking confirmation email
router.post('/send/booking-confirmation', auth, async (req, res) => {
	// Create a test account or replace with real credentials.
	

  const info = await transporter.sendMail({
    from: 'noreply <noreply@ethereal.email>',
    to: "bar@example.com, baz@example.com",
    subject: "Hello",
    text: "Hello world?", // plain‑text body
    html: "<b>Hello world?</b>", // HTML body
  });

  console.log("Message sent:", info.messageId);
});