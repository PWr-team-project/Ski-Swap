const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, adminAuth } = require('../middleware/auth');
const VerificationRequest = require('../models/VerificationRequest');
const User = require('../models/User');

// Create uploads directory for verification documents
const uploadsDir = path.join(__dirname, '../uploads/verification-documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for ID document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'id-document-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for documents
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|pdf/i;
    const allowedMimeTypes = /image\/(jpeg|jpg|png)|application\/pdf/i;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG) and PDF files are allowed!'));
    }
  }
});

// Submit verification request
router.post('/submit', auth, upload.single('id_document_photo'), async (req, res) => {
  try {
    const userId = req.userId;
    const { first_name, last_name, date_of_birth, nationality, id_number } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !date_of_birth || !nationality || !id_number) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'ID document photo is required' });
    }

    // Check if user already has a pending verification request
    const existingRequest = await VerificationRequest.findOne({
      user_id: userId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending verification request' });
    }

    // Check if user is already verified
    const user = await User.findById(userId);
    if (user.id_verified) {
      return res.status(400).json({ message: 'Your account is already verified' });
    }

    // Create verification request
    const verificationRequest = new VerificationRequest({
      user_id: userId,
      first_name,
      last_name,
      date_of_birth: new Date(date_of_birth),
      nationality,
      id_number,
      id_document_photo: `/uploads/verification-documents/${req.file.filename}`,
      status: 'pending'
    });

    await verificationRequest.save();

    res.status(201).json({
      message: 'Verification request submitted successfully. An admin will review your request soon.',
      request: {
        id: verificationRequest._id,
        status: verificationRequest.status,
        createdAt: verificationRequest.createdAt
      }
    });
  } catch (error) {
    console.error('Verification submission error:', error);
    res.status(500).json({ message: 'Server error during verification submission', error: error.message });
  }
});

// Get user's own verification request status
router.get('/my-request', auth, async (req, res) => {
  try {
    const userId = req.userId;

    const verificationRequest = await VerificationRequest.findOne({
      user_id: userId
    }).sort({ createdAt: -1 }); // Get most recent request

    if (!verificationRequest) {
      return res.json({ request: null });
    }

    res.json({
      request: {
        id: verificationRequest._id,
        status: verificationRequest.status,
        createdAt: verificationRequest.createdAt,
        reviewed_at: verificationRequest.reviewed_at,
        rejection_reason: verificationRequest.rejection_reason
      }
    });
  } catch (error) {
    console.error('Verification request fetch error:', error);
    res.status(500).json({ message: 'Server error fetching verification request' });
  }
});

// Admin: Get all verification requests
router.get('/admin/requests', adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    } else {
      // Default to pending if no status specified
      filter.status = 'pending';
    }

    const requests = await VerificationRequest.find(filter)
      .populate('user_id', 'nickname email first_name last_name profile_photo')
      .sort({ createdAt: -1 });

    res.json({
      requests: requests.map(req => ({
        id: req._id,
        user: {
          id: req.user_id._id,
          nickname: req.user_id.nickname,
          email: req.user_id.email,
          name: `${req.user_id.first_name} ${req.user_id.last_name}`,
          profile_photo: req.user_id.profile_photo
        },
        status: req.status,
        createdAt: req.createdAt,
        reviewed_at: req.reviewed_at
      }))
    });
  } catch (error) {
    console.error('Verification requests fetch error:', error);
    res.status(500).json({ message: 'Server error fetching verification requests' });
  }
});

// Admin: Get single verification request details
router.get('/admin/requests/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const request = await VerificationRequest.findById(id)
      .populate('user_id', 'nickname email first_name last_name profile_photo')
      .populate('reviewed_by', 'nickname email');

    if (!request) {
      return res.status(404).json({ message: 'Verification request not found' });
    }

    res.json({
      request: {
        id: request._id,
        user: {
          id: request.user_id._id,
          nickname: request.user_id.nickname,
          email: request.user_id.email,
          name: `${request.user_id.first_name} ${request.user_id.last_name}`,
          profile_photo: request.user_id.profile_photo
        },
        verification_data: {
          first_name: request.first_name,
          last_name: request.last_name,
          date_of_birth: request.date_of_birth,
          nationality: request.nationality,
          id_number: request.id_number,
          id_document_photo: request.id_document_photo
        },
        status: request.status,
        createdAt: request.createdAt,
        reviewed_at: request.reviewed_at,
        reviewed_by: request.reviewed_by ? {
          nickname: request.reviewed_by.nickname,
          email: request.reviewed_by.email
        } : null,
        rejection_reason: request.rejection_reason
      }
    });
  } catch (error) {
    console.error('Verification request detail fetch error:', error);
    res.status(500).json({ message: 'Server error fetching verification request details' });
  }
});

// Admin: Approve verification request
router.post('/admin/requests/:id/approve', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.userId;

    const request = await VerificationRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Verification request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been reviewed' });
    }

    // Update verification request
    request.status = 'approved';
    request.reviewed_by = adminId;
    request.reviewed_at = new Date();
    await request.save();

    // Update user's verified status
    await User.findByIdAndUpdate(request.user_id, {
      id_verified: true
    });

    res.json({
      message: 'Verification request approved successfully',
      request: {
        id: request._id,
        status: request.status,
        reviewed_at: request.reviewed_at
      }
    });
  } catch (error) {
    console.error('Verification approval error:', error);
    res.status(500).json({ message: 'Server error during verification approval' });
  }
});

// Admin: Reject verification request
router.post('/admin/requests/:id/reject', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;
    const adminId = req.userId;

    if (!rejection_reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const request = await VerificationRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'Verification request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been reviewed' });
    }

    // Update verification request
    request.status = 'rejected';
    request.reviewed_by = adminId;
    request.reviewed_at = new Date();
    request.rejection_reason = rejection_reason;
    await request.save();

    res.json({
      message: 'Verification request rejected',
      request: {
        id: request._id,
        status: request.status,
        reviewed_at: request.reviewed_at,
        rejection_reason: request.rejection_reason
      }
    });
  } catch (error) {
    console.error('Verification rejection error:', error);
    res.status(500).json({ message: 'Server error during verification rejection' });
  }
});

module.exports = router;
