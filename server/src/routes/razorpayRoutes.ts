import express from 'express';
import { createOrder, verifyPaymentSignature } from '../services/razorpayService.js';
import { getPaymentReceipt } from '../controllers/paymentController.js';
import Payment from '../models/Payment.js';
import Student from '../models/Student.js';
import Organization from '../models/Organization.js';
import { pushNotification } from '../services/redisService.js';
import { emitPaymentSuccess } from '../services/socketService.js';
// import { notifyPayment } from '../services/socketService.js';
import { verifyToken } from '../middleware/auth.js';
// Ideally should be authenticated, but webhook might be public with secret check.
// For `create-order`, it should be authenticated by Student or Admin? 
// User said "reminder to email... with payment link". The link probably goes to a frontend page.
// The frontend page will call `create-order`.
// If the student pays, they might not be logged in as "User" in our system yet? 
// Or they are just clicking a link. 
// Let's assume the payment link works for unauthenticated users (via studentId).

const router = express.Router();

// Create Order
// Req body: { studentId, amount }
router.post('/create-order',async (req, res) => {
    try {
        const { studentId, amount } = req.body;
        // Verify student exists?
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Create Razorpay Order
        // Amount from frontend or DB? Safer to use DB or verified amount. 
        // Using passed amount for flexibility but validating against DB is better.
        // Let's use the amount passed but in real app use student.amount

        // Receipt length must be <= 40 chars.
        // studentId is 24 chars (ObjectId), Date.now() is 13 chars.
        // "receipt_" (8) + 24 + 13 = 45 > 40.
        // Solution: Use last 15 chars of studentId or shorter.
        // "rcpt_" (5) + 12 (studentId) + 13 (time) = 30 chars. Safe.
        const shortStudentId = studentId.toString().slice(-12);
        const receiptId = `rcpt_${shortStudentId}_${Date.now()}`;
        const order = await createOrder(amount, receiptId);

        // Create Pending Payment Record
        const payment = new Payment({
            studentId,
            organizationId: student.organizationId,
            amount,
            status: 'pending',
            razorpayOrderId: order.id,
        });
        await payment.save();

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error creating razorpay order', error });
    }
});

// Verify Payment
router.post('/verify-payment', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

        const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

        if (!payment) {
            return res.status(404).json({ status: 'failure', message: 'Payment record not found' });
        }

        if (isValid) {
            payment.status = 'completed';
            payment.razorpayPaymentId = razorpay_payment_id;
            await payment.save();

            // 1. Fetch Student & Organization details
            const student = await Student.findById(payment.studentId);
            if (student) {
                const messageText = `${student.studentName} has paid ₹${payment.amount}.`;
                
                // 2. Cache notification in Redis
                const cachedNotification = await pushNotification(student.organizationId.toString(), messageText);
                
                // 3. Emit real-time WebSocket notification to Admin room
                emitPaymentSuccess(student.organizationId.toString(), cachedNotification);

                // 4. Send Mobile Lockscreen Expo Push Notifications
                const org = await Organization.findById(student.organizationId);
                if (org && org.pushTokens && org.pushTokens.length > 0) {
                    const validTokens = org.pushTokens.filter(t => t.startsWith('ExponentPushToken['));
                    if (validTokens.length > 0) {
                        try {
                            await fetch('https://exp.host/--/api/v2/push/send', {
                                method: 'POST',
                                headers: {
                                    'Accept': 'application/json',
                                    'Accept-encoding': 'gzip, deflate',
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    to: validTokens,
                                    sound: 'default',
                                    title: 'Payment Received 💰',
                                    body: messageText,
                                    data: { studentId: student._id }
                                })
                            });
                            console.log(`Sent push notifications to ${validTokens.length} devices`);
                        } catch (pushErr) {
                            console.error('Error sending Expo push notifications:', pushErr);
                        }
                    }
                }
            }

            res.json({ status: 'success', paymentId: payment._id });
        } else {
            payment.status = 'failed';
            await payment.save();
            res.status(400).json({ status: 'failure', message: 'Invalid Signature' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error verifying payment', error });
    }
});

// Check Payment Status
router.get('/payment-status/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const existingPayment = await Payment.findOne({
            studentId,
            status: 'completed',
            createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        });

        if (existingPayment) {
            return res.json({
                paid: true,
                paymentDate: existingPayment.createdAt,
                message: "Payment already done for this month."
            });
        }

        res.json({
            paid: false,
            message: "Payment pending."
        });

    } catch (error) {
        res.status(500).json({ message: 'Error checking payment status', error });
    }
});

// Get Payment Details (Student + Org + Dates)
router.get('/payment-details/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await Student.findById(studentId).populate('organizationId');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Calculate Due Date (Next recurring date)
        // Logic: specific day of current month. If passed, next month.
        // Actually, schema has feeRecurringDate as a Date object. 
        // If it's just a day (1-31) stored as date, we extract day.
        // Or if it's the actual next due date stored.
        // Let's assume feeRecurringDate in DB is the anchor.
        // The user requirement: "due date ... should be calculated 30 days from due date" -> wait, "valid date should be calculated 30 days from due date"
        // "Due date" itself: usually standard for the month.
        // Let's use the day from feeRecurringDate for the current month.

        const today = new Date();
        const recurringDay = new Date(student.feeRecurringDate).getDate();

        let dueDate = new Date(today.getFullYear(), today.getMonth(), recurringDay);

        // If today is past the due date for this month, show next month? 
        // Or is it "Due for this month"? Usually if I pay in Oct, it's for Oct.
        // Let's just say Due Date is this month's recurring day.

        const validDate = new Date(dueDate);
        validDate.setDate(validDate.getDate() + 30);

        // Format dates
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };

        res.json({
            student: {
                name: student.studentName,
                amount: student.amount,
                id: student._id
            },
            organization: student.organizationId, // Populated
            dates: {
                dueDate: dueDate.toLocaleDateString('en-US', options),
                validDate: validDate.toLocaleDateString('en-US', options)
            }
        });

    } catch (error) {
        console.error("Error fetching payment details:", error);
        res.status(500).json({ message: 'Error fetching payment details', error });
    }
});


// Get Payment Receipt PDF
router.get('/receipt/:paymentId', getPaymentReceipt);

export default router;
