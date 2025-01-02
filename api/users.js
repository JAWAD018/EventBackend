// /api/users.js
const mongoose = require('mongoose');
const multer = require('multer');
const QRCode = require('qrcode');

// Multer setup for file upload (in memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const User = mongoose.model('User', new mongoose.Schema({
    qrCode: { type: String, required: true, unique: true },
    qrCodeImage: { type: String },
    name: { type: String, required: true },
    email: { type: String, required: true },
    gender: String,
    group: String,
    photo: { type: String },
}, { timestamps: true }), 'qrdata');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://mohammedjawad0036:x4eo4wieSwHK4iQK@cluster0.tvmj9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

module.exports = async (req, res) => {
    if (req.method === 'GET') {
        // Get all users
        try {
            const users = await User.find();
            res.status(200).json({ success: true, users });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Error fetching users.' });
        }
    } else if (req.method === 'POST') {
        // Create or update a user with file upload
        upload.single('photo')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: 'Error uploading file.' });
            }

            const { qrCode, name, email, gender, group } = req.body;
            const file = req.file; // The uploaded photo

            if (!qrCode || !name || !email || !group || !file) {
                return res.status(400).json({
                    success: false,
                    message: 'QR Code, name, group, photo (base64) and email are required.'
                });
            }

            const photoBase64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

            // Generate QR code for the user
            const qrCodeImage = await QRCode.toDataURL(qrCode, { errorCorrectionLevel: 'H', margin: 1, width: 300 });

            const userData = {
                qrCode,
                name,
                email,
                gender,
                group,
                photo: photoBase64,
                qrCodeImage
            };

            try {
                const user = await User.findOneAndUpdate(
                    { qrCode: userData.qrCode },
                    userData,
                    { new: true, upsert: true }
                );
                res.status(200).json({ success: true, message: 'User data saved successfully.', user });
            } catch (err) {
                if (err.code === 11000) {
                    res.status(400).json({ success: false, message: 'QR Code already exists.' });
                } else {
                    res.status(500).json({ success: false, message: 'Error saving user data.' });
                }
            }
        });
    }
};
