const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const { auth } = require('../middleware/auth');

// Note: Location management is primarily handled through the user profile endpoint
// These routes are kept for backwards compatibility and specific use cases

// Get location by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json(location);
  } catch (error) {
    console.error('Location fetch error:', error);
    res.status(500).json({ message: 'Server error fetching location' });
  }
});

module.exports = router;
