const express = require('express');
const User = require('../models/user');

const app = express();
app.use(express.json());

// Check if QR code exists
app.post('/api/check-qr', async (req, res) => {
  const { qrCode } = req.body;
  try {
    const user = await User.findOne({ qrCode });
    if (user) {
      res.json({
        success: true,
        name: user.name,
        gender: user.gender,
        group: user.group,
        email: user.email,
        photo: user.photo,
      });
    } else {
      res.json({ success: false, message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error checking QR code' });
  }
});

// Export as Vercel Serverless function
module.exports = app;
