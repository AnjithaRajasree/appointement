const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const { isSlotAvailable } = require('../services/bookingService');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// ✅ Create Appointment
router.post(
  '/',
  auth,
  [
    body('providerId').notEmpty().isMongoId().withMessage('Valid providerId is required'),
    body('startTime').notEmpty().isISO8601().withMessage('Valid startTime is required'),
    body('endTime').notEmpty().isISO8601().withMessage('Valid endTime is required'),
    body('notes').optional().isString(),
  ],
  async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { providerId, startTime, endTime, notes } = req.body;

    try {
      // Check that endTime is after startTime
      if (new Date(startTime) >= new Date(endTime)) {
        return res.status(400).json({ msg: 'endTime must be after startTime' });
      }

      // Check slot availability
      const available = await isSlotAvailable(providerId, new Date(startTime), new Date(endTime));
      if (!available) return res.status(400).json({ msg: 'Time slot is already booked' });

      // Create appointment
      const appointment = await Appointment.create({
        clientId: req.user.id,
        providerId,
        startTime,
        endTime,
        notes,
      });

      res.status(201).json(appointment);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// ✅ Get Appointments for Logged-in Client
router.get('/my', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ clientId: req.user.id }).populate('providerId', 'name email');
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ✅ (Optional) Get Appointments for Logged-in Provider
router.get('/provider', auth, async (req, res) => {
  if (req.user.role !== 'provider') {
    return res.status(403).json({ msg: 'Access denied: only providers can view this' });
  }

  try {
    const appointments = await Appointment.find({ providerId: req.user.id }).populate('clientId', 'name email');
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
