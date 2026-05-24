import express from 'express';
import {
    createStudent,
    getStudents,
    updateStudent,
    toggleStudentStatus,
    sendPaymentLinkEmail,
    generatePDFReport,
    getMonthlyStats,
    getChartData,
    getTransactions,
    sendPaymentReminders,
    getPendingPaymentsCount,
    getNotifications,
    savePushToken
} from '../controllers/adminController.js';
import { verifyToken, assignRole, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All routes require Admin role
router.use(verifyToken, assignRole, requireRole('admin'));

router.post('/students', createStudent);
router.get('/students', getStudents);
router.put('/students/:id', updateStudent);
router.patch('/students/:id/status', toggleStudentStatus);
router.post('/students/reminder/:id', sendPaymentLinkEmail);
router.post('/students/reminder-all', sendPaymentReminders);
router.get('/students/pending-count', getPendingPaymentsCount);
router.get('/students/report/pdf', generatePDFReport);

// Dashboard Routes
router.get('/stats/monthly', getMonthlyStats);
router.get('/stats/chart', getChartData);
router.get('/transactions', getTransactions);
router.get('/notifications', getNotifications);
router.post('/push-token', savePushToken);

export default router;
