const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { renderHtml, sendEmailWithTemplate } = require('../services/emailService');
const Booking = require('../models/Booking');
const BookingStatus = require('../models/BookingStatus');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Listing = require('../models/Listing');
const { auth } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');


// POST endpoint for sending generic email
router.post('/', auth, async (req, res) => {
  try {
    const { 
      to, 
      subject, 
      text = null, 
      html, 
      attachments = null, 
      cc = [], 
      bcc = [],
      replyTo = null
    } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ error: 'From, To and Subject are required' });
    }

    const mailOptions = {
      from: `SkiSwap <${process.env.GOOGLE_APP_LOGIN}>`,
      to: to,
      subject: subject,
      text: text,
      html: html,
      attachments: attachments,
      cc: cc,
      bcc: bcc,
      replyTo: replyTo
    };

    const info = await transporter.sendMail(mailOptions);

    res.status(200).json({ messageId: info.messageId });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}

);

// POST endpoint for sending welcome email
router.post('/welcome', auth, async (req, res) => {
  try {
    const { 
      to, 
      nickname,
      firstName, 
      lastName, 
      emailSubject = 'Welcome to SkiSwap!',
    } = req.body;

    if (!to || !firstName || !lastName) {
      return res.status(400).json({ error: 'To, FirstName, and LastName are required' });
    }

    const mailOptions = {
      to: to,
      subject: emailSubject,
      attachments: null,
      cc: [],
      bcc: []
    };

    await sendEmailWithTemplate(mailOptions, 'emailWelcome.html', {
      nickname: nickname,
      firstName: firstName,
      lastName: lastName,
      name: `${firstName} ${lastName}`,
      email: to
    });

  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
});

// POST endpoint for sending booking confirmation email
router.post('/booking-confirmation', auth, async (req, res) => {
  try {
    const { 
      to,
      nickname,
      itemType,
      itemName,
      bookingDate,
      bookingTime,
      bookingDuration,
      price
    } = req.body;

    if (!to || !nickname || !itemType || !itemName || !bookingDate || !price) {
      return res.status(400).json({ error: 'To, nickname, ItemType, ItemName, BookingDate, and Price are required' });
    }
    
    const mailOptions = {
      to: to,
      subject: `Booking Confirmation: ${itemType}`,
      attachments: null,
      cc: [],
      bcc: []
    };

    const fillValues = {
      itemType: itemType,
      nickname: nickname,
      itemName: itemName,
      bookingDate: bookingDate,
      bookingTime: bookingTime,
      bookingDuration: bookingDuration,
      price: price
    };

    await sendEmailWithTemplate(mailOptions, 'emailBookingConfirm.html', fillValues);

  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    res.status(500).json({ error: 'Failed to send booking confirmation email' });
  }
});

// POST endpoint for sending payment receipt email
router.post('/payment-receipt', auth, async (req, res) => {
  try {
    const { 
      to,
      nickname,
      itemType,
      itemName,
      paymentDate,
      amount,
      paymentMethod
    } = req.body;

    if (!to || !nickname || !itemType || !itemName || !paymentDate || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'To, nickname, ItemType, ItemName, PaymentDate, Amount, and PaymentMethod are required' });
    }

    const mailOptions = {
      to: to,
      subject: `Payment Receipt for ${itemType}`,
      attachments: null,
      cc: [],
      bcc: []
    };

    const fillValues = {
      itemType: itemType,
      nickname: nickname,
      itemName: itemName,
      paymentDate: paymentDate,
      amount: amount,
      paymentMethod: paymentMethod
    };

    await sendEmailWithTemplate(mailOptions, 'emailPaymentReceipt.html', fillValues);

  } catch (error) {
    console.error('Error sending payment receipt email:', error);
    res.status(500).json({ error: 'Failed to send payment receipt email' });
  }
});

router.post('/cancel-booking', auth, async (req, res) => {
  try {
    const { 
      to, 
      nickname, 
      itemType, 
      itemName,
      reason
    } = req.body;

    if (!to || !nickname || !itemType || !itemName) {
      return res.status(400).json({ error: 'To, nickname, ItemType, and ItemName are required' });
    }

    const mailOptions = {
      to: to,
      subject: `Cancellation Notification: ${itemType}`,
      attachments: null,
      cc: [],
      bcc: []
    };

    const fillValues = {
      itemType: itemType,
      nickname: nickname,
      itemName: itemName,
      reason: reason
    };

    await sendEmailWithTemplate(mailOptions, 'emailCancel.html', fillValues);

  } catch (error) {
    console.error('Error sending cancellation email:', error);
    res.status(500).json({ error: 'Failed to send cancellation email' });
  }
});

module.exports = router;
