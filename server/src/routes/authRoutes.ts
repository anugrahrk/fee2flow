import express from 'express';
import { verifyToken, assignRole } from '../middleware/auth.js';

const router = express.Router();

// Get current user role and details
router.get('/me', verifyToken, assignRole, (req, res) => {
    // If we reach here, verifyToken and assignRole have run.
    // req.role should be populated.
    // req.clerkUser should be populated.

    if (!req.role) {
        // Should ideally be caught by middleware or not happen if assignRole always sets a role
        return res.status(500).json({ error: "Role could not be determined" });
    }

    const primaryEmail = req.clerkUser?.emailAddresses.find(
        (e) => e.id === req.clerkUser?.primaryEmailAddressId
    )?.emailAddress;

    res.json({
        role: req.role,
        email: primaryEmail,
        organizationId: req.organizationId,
        user: req.dbUser
    });
});

export default router;
