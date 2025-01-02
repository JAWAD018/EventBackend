const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const multer = require('multer');
const fs = require('fs');
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'https://eventz-backend.vercel.app/', // Allow only your frontend domain
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true
}));




// Multer setup for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://mohammedjawad0036:x4eo4wieSwHK4iQK@cluster0.tvmj9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// User Schema with QR code and photo field
const userSchema = new mongoose.Schema({
    qrCode: {
        type: String,
        required: true,
        unique: true
    },
    qrCodeImage: {
        type: String,  // Store base64 QR code image
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    gender: String,
    group: String,
    photo: {         // Store base64 photo
        type: String,
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema, 'qrdata');

// Generate QR Code endpoint
app.post('/api/generate-qr', async (req, res) => {
    try {
        const { data } = req.body;
        if (!data) {
            return res.status(400).json({
                success: false,
                message: 'Data is required for QR code generation'
            });
        }

        // Generate QR code as base64 string
        const qrCodeImage = await QRCode.toDataURL(data, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 300
        });

        res.json({
            success: true,
            qrCodeImage
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error generating QR code'
        });
    }
});

// Get all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching users.' });
    }
});

// Create or update user with file upload
app.post('/api/users', upload.single('photo'), async (req, res) => {
    try {
        const userData = req.body;
        const file = req.file; // The uploaded photo

        // Check for required fields
        if (!userData.qrCode || !userData.name || !userData.email || !userData.group || !file) {
            return res.status(400).json({
                success: false,
                message: 'QR Code, name, group, photo (base64) and email are required.'
            });
        }

        // Convert the uploaded photo to base64 string
        const photoBase64 = file ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}` : null;

        // Generate QR code for the user
        const qrCodeImage = await QRCode.toDataURL(userData.qrCode, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 300
        });

        // Add QR code image and photo to user data
        userData.qrCodeImage = qrCodeImage;
        userData.photo = photoBase64;

        // Update or create user with QR code and photo (in base64)
        const user = await User.findOneAndUpdate(
            { qrCode: userData.qrCode },
            userData,
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            message: 'User data saved successfully.',
            user
        });
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({
                success: false,
                message: 'QR Code already exists.'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error saving user data.'
            });
        }
    }
});

// Check QR code and retrieve user info
app.post('/api/check-qr', async (req, res) => {
    const { qrCode } = req.body;
    try {
        // Query the database to find the user by the QR code
        const user = await User.findOne({ qrCode });
        if (user) {
            res.json({
                success: true,
                name: user.name,
                gender: user.gender,
                group: user.group,
                email: user.email,
                photo: user.photo // The base64-encoded photo
            });
        } else {
            res.json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error checking QR code.' });
    }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;
