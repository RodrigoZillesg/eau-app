"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Apply authentication middleware to all storage routes
router.use(auth_1.authenticate);
// Ensure directories exist
const avatarsDir = path_1.default.join(__dirname, '../../public/avatars');
const eventsDir = path_1.default.join(__dirname, '../../public/events');
const receiptsDir = path_1.default.join(__dirname, '../../public/receipts');
if (!fs_1.default.existsSync(avatarsDir)) {
    fs_1.default.mkdirSync(avatarsDir, { recursive: true });
}
if (!fs_1.default.existsSync(eventsDir)) {
    fs_1.default.mkdirSync(eventsDir, { recursive: true });
}
if (!fs_1.default.existsSync(receiptsDir)) {
    fs_1.default.mkdirSync(receiptsDir, { recursive: true });
}
// Configure multer for disk storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, avatarsDir);
    },
    filename: (req, file, cb) => {
        const user = req.user;
        const userId = user?.id || 'unknown';
        const fileExt = path_1.default.extname(file.originalname).toLowerCase();
        const fileName = `avatar-${userId}-${Date.now()}${fileExt}`;
        cb(null, fileName);
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
        }
    },
});
/**
 * POST /api/v1/storage/upload-avatar
 * Upload avatar image to local storage
 */
router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Get user from request (set by auth middleware)
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        console.log('Avatar uploaded successfully:', {
            userId: user.id,
            fileName: req.file.filename,
            size: req.file.size,
            type: req.file.mimetype,
            path: req.file.path
        });
        // Generate public URL
        const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
        const publicUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;
        console.log('Public URL generated:', publicUrl);
        // Return the public URL
        res.json({
            success: true,
            publicUrl,
            fileName: req.file.filename,
        });
    }
    catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message,
        });
    }
});
/**
 * DELETE /api/v1/storage/delete-avatar
 * Delete avatar image from local storage
 */
router.delete('/delete-avatar', async (req, res) => {
    try {
        const { fileName } = req.body;
        if (!fileName) {
            return res.status(400).json({ error: 'No file name provided' });
        }
        // Get user from request (set by auth middleware)
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        console.log('Deleting avatar:', { userId: user.id, fileName });
        // Construct file path
        const filePath = path_1.default.join(avatarsDir, fileName);
        // Check if file exists
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        // Delete file from disk
        fs_1.default.unlinkSync(filePath);
        console.log('Delete successful:', filePath);
        res.json({
            success: true,
            message: 'Avatar deleted successfully',
        });
    }
    catch (error) {
        console.error('Avatar delete error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message,
        });
    }
});
/**
 * POST /api/v1/storage/upload-event-image
 * Upload event image to local storage
 */
const eventUpload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, eventsDir);
        },
        filename: (req, file, cb) => {
            const fileExt = path_1.default.extname(file.originalname).toLowerCase();
            const fileName = `event-${Date.now()}${fileExt}`;
            cb(null, fileName);
        }
    }),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
        }
    },
});
router.post('/upload-event-image', eventUpload.single('eventImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Get user from request (set by auth middleware)
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        console.log('Event image uploaded successfully:', {
            userId: user.id,
            fileName: req.file.filename,
            size: req.file.size,
            type: req.file.mimetype,
            path: req.file.path
        });
        // Generate public URL
        const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
        const publicUrl = `${baseUrl}/uploads/events/${req.file.filename}`;
        console.log('Public URL generated:', publicUrl);
        // Return the public URL
        res.json({
            success: true,
            publicUrl,
            fileName: req.file.filename,
        });
    }
    catch (error) {
        console.error('Event image upload error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message,
        });
    }
});
/**
 * POST /api/v1/storage/upload-payment-receipt
 * Upload payment receipt to local storage
 */
const receiptUpload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, receiptsDir);
        },
        filename: (req, file, cb) => {
            const registrationId = req.body.registrationId || 'unknown';
            const fileExt = path_1.default.extname(file.originalname).toLowerCase();
            const fileName = `receipt-${registrationId}-${Date.now()}${fileExt}`;
            cb(null, fileName);
        }
    }),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF, JPG, and PNG files are allowed'));
        }
    },
});
router.post('/upload-payment-receipt', receiptUpload.single('receipt'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Get user from request (set by auth middleware)
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        console.log('Payment receipt uploaded successfully:', {
            userId: user.id,
            registrationId: req.body.registrationId,
            fileName: req.file.filename,
            size: req.file.size,
            type: req.file.mimetype,
            path: req.file.path
        });
        // Generate public URL
        const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`;
        const publicUrl = `${baseUrl}/uploads/receipts/${req.file.filename}`;
        console.log('Public URL generated:', publicUrl);
        // Return the public URL
        res.json({
            success: true,
            publicUrl,
            fileName: req.file.filename,
        });
    }
    catch (error) {
        console.error('Payment receipt upload error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=storage.routes.js.map