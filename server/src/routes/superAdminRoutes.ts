import express from 'express';
import {
    createOrganization,getAllOrganizations,getOrganizationStats,toggleOrganizationStatus,updateOrganization, getRecentTransactions, deleteOrganization
} from '../controllers/superAdminController.js';
import { verifyToken,assignRole,requireRole} from '../middleware/auth.js';

const router = express.Router();

// Middleware applied to all routes in this router
router.use(verifyToken,assignRole,requireRole('super_user'));

router.post('/organizations', createOrganization);
router.get('/organizations/stats', getOrganizationStats);
router.get('/organizations', getAllOrganizations);
router.put('/organizations/:id', updateOrganization);
router.patch('/organizations/:id/status', toggleOrganizationStatus);
router.delete('/organizations/:id', deleteOrganization);
router.get('/transactions', getRecentTransactions);
export default router;
