import { Request, Response } from 'express';
import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import { sendPaymentLink, sendReminder } from '../services/emailService.js';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit-table';
import { getNotifications as fetchRedisNotifications } from '../services/redisService.js';
import Organization from '../models/Organization.js';

// Create Student
export const createStudent = async (req: Request, res: Response) => {
    try {
        const organizationId = req.organizationId;
        if (!organizationId) return res.status(403).json({ message: 'Organization ID missing' });

        const { studentName, email, mobileNumber, feeRecurringDate, amount } = req.body;

        // Check existing student? Email should be unique globally or per org? 
        // Schema says unique sparse.
        if (email) {
            const existing = await Student.findOne({ email });
            if (existing) return res.status(400).json({ message: 'Student with this email already exists' });
        }

        const student = new Student({
            studentName,
            email,
            mobileNumber,
            feeRecurringDate,
            amount,
            organizationId,
            isEnabled: true
        });

        await student.save();
        res.status(201).json(student);
    } catch (error) {
        res.status(500).json({ message: 'Error creating student', error });
    }
};

// Get Students (Search, Filter, Pagination)
export const getStudents = async (req: Request, res: Response) => {
    try {
        const organizationId = req.organizationId;
        if (!organizationId) return res.status(403).json({ message: 'Organization ID missing' });

        const page = parseInt(req.query.page as string) || 1;
        const limit = 5;
        const search = req.query.search as string || '';
        const sort = req.query.sort as string; // 'nearDate'
        const status = req.query.status as string; // 'true' | 'false'
        const minAmount = req.query.minAmount ? Number(req.query.minAmount) : undefined;
        const maxAmount = req.query.maxAmount ? Number(req.query.maxAmount) : undefined;

        const query: any = { organizationId };

        if (search) {
            query.$or = [
                { studentName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobileNumber: { $regex: search, $options: 'i' } }
            ];
        }

        if (status) {
            query.isEnabled = status === 'true';
        }

        if (minAmount !== undefined || maxAmount !== undefined) {
            query.amount = {};
            if (minAmount !== undefined) query.amount.$gte = minAmount;
            if (maxAmount !== undefined) query.amount.$lte = maxAmount;
        }

        // Sort Logic
        let sortOption: any = { createdAt: -1 };
        if (sort === 'nearDate') {
            // Nearest recurring date to today.
            // This is tricky in MongoDB simple sort if dates are past/future mixed.
            // Usually means "closest absolute difference".
            // Or just ascending order of feeRecurringDate?
            // Let's assume ascending order for simplicity as "upcoming".
            sortOption = { feeRecurringDate: 1 };
        }

        const total = await Student.countDocuments(query);
        const students = await Student.find(query)
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            data: students,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                startIndex: (page - 1) * limit + 1,
                endIndex: Math.min(page * limit, total)
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error });
    }
};

// Update Student
export const updateStudent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { studentName, email, mobileNumber, feeRecurringDate, amount } = req.body;

        const student = await Student.findOneAndUpdate(
            { _id: id, organizationId: req.organizationId },
            { studentName, email, mobileNumber, feeRecurringDate, amount },
            { new: true }
        );

        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: 'Error updating student', error });
    }
};

// Toggle Status
export const toggleStudentStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isEnabled } = req.body;

        const student = await Student.findOneAndUpdate(
            { _id: id, organizationId: req.organizationId },
            { isEnabled },
            { new: true }
        );

        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: 'Error updating status', error });
    }
};

// Send Payment Link
export const sendPaymentLinkEmail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const student = await Student.findOne({ _id: id, organizationId: req.organizationId });

        if (!student || !student.email) {
            return res.status(404).json({ message: 'Student not found or email missing' });
        }

        // Generate Razorpay Link or use a frontend URL with query params
        // Assuming frontend URL for now: e.g., https://myapp.com/pay?studentId=...
        const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pay/${student._id}`;

        await sendPaymentLink(student.email, student.studentName, paymentLink);
        res.json({ message: 'Payment link sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending email', error });
    }
};

// Generate PDF Report
// Generate PDF Report
export const generatePDFReport = async (req: Request, res: Response) => {
    try {
        const organizationId = req.organizationId;
        const students = await Student.find({ organizationId });

        const uploadDir = path.join(process.cwd(), 'upload');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `output_${organizationId}.pdf`;
        const filePath = path.join(uploadDir, fileName);

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);

        doc.fontSize(18).text('Student Report', { align: 'center' });
        doc.moveDown();

        const table = {
            title: "All Students",
            subtitle: `Total Students: ${students.length}`,
            headers: ["Name", "Email", "Mobile", "Amount", "Due Date", "Status"],
            rows: students.map((s: any) => [
                s.studentName,
                s.email || '-',
                s.mobileNumber || '-',
                s.amount.toString(),
                new Date(s.feeRecurringDate).toLocaleDateString(),
                s.isEnabled ? 'Active' : 'Disabled'
            ]),
        };

        await doc.table(table as any, {
            width: 500,
        });

        doc.end();

        writeStream.on('finish', () => {
            const downloadUrl = `${req.protocol}://${req.get('host')}/upload/${fileName}`;
            res.json({ message: 'PDF generated successfully', downloadUrl });
        });

        writeStream.on('error', (err) => {
            console.error('Error writing PDF file:', err);
            res.status(500).json({ message: 'Error generating PDF file', error: err });
        });

    } catch (error) {
        res.status(500).json({ message: 'Error generating PDF', error });
    }
};

// --- Dashboard Stats ---

// Get Monthly Stats
export const getMonthlyStats = async (req: Request, res: Response) => {
    try {
        const organizationId = req.organizationId;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Current Month Stats
        const currentMonthPayments = await Payment.aggregate([
            {
                $match: {
                    organizationId: organizationId,
                    createdAt: { $gte: startOfMonth },
                    status: 'completed'
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        const totalCollections = currentMonthPayments[0]?.total || 0;
        const transactionVolume = currentMonthPayments[0]?.count || 0; // Or all transactions including pending? Assuming completed for now.

        // Last Month Stats (for Growth Calc)
        const lastMonthPayments = await Payment.aggregate([
            {
                $match: {
                    organizationId: organizationId,
                    createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
                    status: 'completed'
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const lastMonthCollections = lastMonthPayments[0]?.total || 0;

        let collectionGrowth = 0;
        if (lastMonthCollections > 0) {
            collectionGrowth = ((totalCollections - lastMonthCollections) / lastMonthCollections) * 100;
        } else if (totalCollections > 0) {
            collectionGrowth = 100; // 100% growth if started from 0
        }

        // Pending Dues (This Month created payments that are pending)
        const pendingPayments = await Payment.aggregate([
            {
                $match: {
                    organizationId: organizationId,
                    createdAt: { $gte: startOfMonth },
                    status: { $in: ['pending', 'failed'] }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const pendingDues = pendingPayments[0]?.total || 0;

        // Pending Growth? (vs Last Month)
        const lastMonthPending = await Payment.aggregate([
            {
                $match: {
                    organizationId: organizationId,
                    createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
                    status: { $in: ['pending', 'failed'] }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const lastMonthPendingTotal = lastMonthPending[0]?.total || 0;

        let pendingGrowth = 0;
        if (lastMonthPendingTotal > 0) {
            pendingGrowth = ((pendingDues - lastMonthPendingTotal) / lastMonthPendingTotal) * 100;
        } else if (pendingDues > 0) {
            pendingGrowth = 100;
        }

        res.json({
            totalCollections,
            collectionGrowth: Math.round(collectionGrowth),
            pendingDues,
            pendingGrowth: Math.round(pendingGrowth),
            transactionVolume
        });

    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ message: 'Error fetching stats', error });
    }
};

// Get Chart Data
export const getChartData = async (req: Request, res: Response) => {
    try {
        const organizationId = req.organizationId;
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 5); // Last 6 months
        start.setDate(1); // Start of that month

        const payments = await Payment.aggregate([
            {
                $match: {
                    organizationId: organizationId,
                    createdAt: { $gte: start, $lte: end },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Map to format [{name: 'Jan', value: 1000}, ...]
        // Note: aggregation returns month 1-12.
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // This returns only months with data. The frontend logic I wrote fills in the gaps.
        // So I can just return this simple mapped array.
        const result = payments.map(p => ({
            name: monthNames[p._id.month - 1],
            value: p.total
        }));

        res.json(result);

    } catch (error) {
        res.status(500).json({ message: 'Error fetching chart data', error });
    }
};

// Get Transactions
export const getTransactions = async (req: Request, res: Response) => {
    try {
        const organizationId = req.organizationId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 5;

        const total = await Payment.countDocuments({ organizationId });

        const transactions = await Payment.find({ organizationId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('studentId', 'studentName');

        // Map to flatten structure if needed or return as is
        const mappedTransactions = transactions.map((t: any) => ({
            _id: t._id,
            transactionId: t.razorpayPaymentId || t._id.toString().slice(-6).toUpperCase(),
            studentName: t.studentId?.studentName || 'Unknown',
            amount: t.amount,
            date: t.updatedAt, // User requested updatedAt
            status: t.status
        }));

        res.json({
            data: mappedTransactions, // User requested 'data' key in store
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                startIndex: (page - 1) * limit + 1,
                endIndex: Math.min(page * limit, total)
            }
        });

    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Error fetching transactions', error });
    }
};

// Send Payment Reminders (Bulk)
export const sendPaymentReminders = async (req: Request, res: Response) => {
    try {
        const organizationId = req.organizationId;
        const now = new Date();
        const currentDay = now.getDate();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // 1. Get all enabled students
        const students = await Student.find({ organizationId, isEnabled: true });

        // 2. Get all completed payments for this month
        const payments = await Payment.find({
            organizationId,
            status: 'completed',
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }).select('studentId');

        const paidStudentIds = new Set(payments.map(p => p.studentId.toString()));

        // 3. Filter overdue and unpaid
        const overdueStudents = students.filter(student => {
            const dueDay = new Date(student.feeRecurringDate).getDate();
            const isOverdue = currentDay > dueDay;
            const isPaid = paidStudentIds.has(student._id.toString());
            return isOverdue && !isPaid;
        });

        // 4. Send Emails
        let sentCount = 0;
        for (const student of overdueStudents) {
            if (student.email) {
                await sendReminder(student.email, student.studentName, student.amount);
                sentCount++;
            }
        }

        res.json({ message: `Reminders sent to ${sentCount} students`, totalOverdue: overdueStudents.length });

    } catch (error) {
        console.error('Error sending reminders:', error);
        res.status(500).json({ message: 'Error sending reminders', error });
    }
};

// Get Pending Payments Count
export const getPendingPaymentsCount = async (req: Request, res: Response) => {
    try {
        const organizationId = req.organizationId;
        const now = new Date();
        const currentDay = now.getDate();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // 1. Get all enabled students
        const students = await Student.find({ organizationId, isEnabled: true });

        // 2. Get all completed payments for this month
        const payments = await Payment.find({
            organizationId,
            status: 'completed',
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }).select('studentId');

        const paidStudentIds = new Set(payments.map(p => p.studentId.toString()));

        // 3. Filter overdue and unpaid
        const overdueStudents = students.filter(student => {
            const dueDay = new Date(student.feeRecurringDate).getDate();
            const isOverdue = currentDay > dueDay; // Date has passed
            const isPaid = paidStudentIds.has(student._id.toString());
            return isOverdue && !isPaid;
        });

        res.json({
            count: overdueStudents.length,
            students: overdueStudents.map(s => ({
                id: s._id,
                name: s.studentName,
                amount: s.amount,
                dueDate: new Date(s.feeRecurringDate).getDate() // Just the day
            }))
        });

    } catch (error) {
        console.error('Error fetching pending count:', error);
        res.status(500).json({ message: 'Error fetching pending count', error });
    }
};

// Get Notifications from Redis
export const getNotifications = async (req: Request, res: Response) => {
    try {
        const organizationId = req.organizationId;
        if (!organizationId) return res.status(403).json({ message: 'Organization ID missing' });

        const notifications = await fetchRedisNotifications(organizationId.toString());
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching cached notifications:', error);
        res.status(500).json({ message: 'Error fetching notifications', error });
    }
};

// Save Push Token for Mobile Lockscreen Notifications
export const savePushToken = async (req: Request, res: Response) => {
    try {
        const organizationId = req.organizationId;
        if (!organizationId) return res.status(403).json({ message: 'Organization ID missing' });

        const { pushToken } = req.body;
        if (!pushToken) return res.status(400).json({ message: 'Push token missing' });

        const org = await Organization.findById(organizationId);
        if (!org) return res.status(404).json({ message: 'Organization not found' });

        // Add if not already present
        if (!org.pushTokens) {
            org.pushTokens = [];
        }
        if (!org.pushTokens.includes(pushToken)) {
            org.pushTokens.push(pushToken);
            await org.save();
        }

        res.json({ message: 'Push token saved successfully' });
    } catch (error) {
        console.error('Error saving push token:', error);
        res.status(500).json({ message: 'Error saving push token', error });
    }
};
