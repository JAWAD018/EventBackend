// /api/generate-qr.js
const QRCode = require('qrcode');

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        const { data } = req.body;
        if (!data) {
            return res.status(400).json({
                success: false,
                message: 'Data is required for QR code generation'
            });
        }

        try {
            const qrCodeImage = await QRCode.toDataURL(data, {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: 300
            });

            res.status(200).json({
                success: true,
                qrCodeImage
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Error generating QR code'
            });
        }
    }
};
