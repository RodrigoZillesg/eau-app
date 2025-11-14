import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// Apply authentication middleware to all storage routes
router.use(authenticate);

// Ensure directories exist
const avatarsDir = path.join(__dirname, '../../public/avatars');
const eventsDir = path.join(__dirname, '../../public/events');
const receiptsDir = path.join(__dirname, '../../public/receipts');

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

if (!fs.existsSync(eventsDir)) {
  fs.mkdirSync(eventsDir, { recursive: true });
}

if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const user = (req as AuthRequest).user;
    const userId = user?.id || 'unknown';
    const fileExt = path.extname(file.originalname).toLowerCase();
    const fileName = `avatar-${userId}-${Date.now()}${fileExt}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
    }
  },
});

/**
 * POST /api/v1/storage/upload-avatar
 * Upload avatar image to local storage
 */
router.post('/upload-avatar', upload.single('avatar'), async (req: AuthRequest, res: Response) => {
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

  } catch (error: any) {
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
router.delete('/delete-avatar', async (req: AuthRequest, res: Response) => {
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
    const filePath = path.join(avatarsDir, fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file from disk
    fs.unlinkSync(filePath);

    console.log('Delete successful:', filePath);

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
    });

  } catch (error: any) {
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
const eventUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, eventsDir);
    },
    filename: (req, file, cb) => {
      const fileExt = path.extname(file.originalname).toLowerCase();
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
    } else {
      cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'));
    }
  },
});

router.post('/upload-event-image', eventUpload.single('eventImage'), async (req: AuthRequest, res: Response) => {
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

  } catch (error: any) {
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
const receiptUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, receiptsDir);
    },
    filename: (req, file, cb) => {
      const registrationId = req.body.registrationId || 'unknown';
      const fileExt = path.extname(file.originalname).toLowerCase();
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
    } else {
      cb(new Error('Only PDF, JPG, and PNG files are allowed'));
    }
  },
});

router.post('/upload-payment-receipt', receiptUpload.single('receipt'), async (req: AuthRequest, res: Response) => {
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

  } catch (error: any) {
    console.error('Payment receipt upload error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

export default router;
