// Central export file for all models
const User = require('./User');
const Location = require('./Location');
const Category = require('./Category');
const Listing = require('./Listing');
const Booking = require('./Booking');
const BookingStatus = require('./BookingStatus');
const BookingMessage = require('./BookingMessage');
const Payment = require('./Payment');
const Review = require('./Review');
const Message = require('./Message');

module.exports = {
  User,
  Location,
  Category,
  Listing,
  Booking,
  BookingStatus,
  BookingMessage,
  Payment,
  Review,
  Message
};
