const Appointment = require('../models/Appointment');

async function isSlotAvailable(providerId, start, end) {
  const conflict = await Appointment.findOne({
    providerId,
    status: { $ne: 'cancelled' },
    $or: [
      { startTime: { $lt: end }, endTime: { $gt: start } }
    ]
  });
  return !conflict;
}

module.exports = { isSlotAvailable };
