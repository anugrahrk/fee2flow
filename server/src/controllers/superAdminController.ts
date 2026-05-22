import { Request, Response } from 'express';
import Organization from '../models/Organization.js';
import Payment from '../models/Payment.js';

// Create Organization
export const createOrganization = async (req: Request, res: Response) => {
    try {
        const { orgName, ownerName, mobileNumber, email } = req.body;
        console.log(req.role)
        // Check if org with email exists
        const existingOrg = await Organization.findOne({ email });
        if (existingOrg) {
            return res.status(400).json({ message: 'Organization with this email already exists' });
        }

        const org = new Organization({
            orgName,
            ownerName,
            mobileNumber,
            email
        });

        await org.save();
        res.status(201).json(org);
    } catch (error) {
        res.status(500).json({ message: 'Error creating organization', error });
    }
};
export const getOrganizationStats = async (req: Request, res: Response) => {
    try {
        const total = await Organization.countDocuments();
        const active = await Organization.countDocuments({ isEnabled: true });
        const disabled = await Organization.countDocuments({ isEnabled: false });

        res.json({ total, active, disabled });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error });
    }
};

// Get All Organizations (Paginated & Search)
export const getAllOrganizations = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = 5; // Fixed as per requirement
        const search = req.query.search as string || '';

        const query: any = {};
        if (search) {
            query.$or = [
                { orgName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { ownerName: { $regex: search, $options: 'i' } },
                { mobileNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Organization.countDocuments(query);
        const organizations = await Organization.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({
            data: organizations,
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
        res.status(500).json({ message: 'Error fetching organizations', error });
    }
};

// Update Organization
export const updateOrganization = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { orgName, ownerName, mobileNumber, email } = req.body;

        const org = await Organization.findByIdAndUpdate(
            id,
            { orgName, ownerName, mobileNumber, email },
            { new: true }
        );

        if (!org) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        res.json(org);
    } catch (error) {
        res.status(500).json({ message: 'Error updating organization', error });
    }
};

// Toggle Status
export const toggleOrganizationStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isEnabled } = req.body; // Expect boolean

        const org = await Organization.findByIdAndUpdate(
            id,
            { isEnabled },
            { new: true }
        );

        if (!org) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        res.json(org);
    } catch (error) {
        res.status(500).json({ message: 'Error updating status', error });
    }
};

// Delete Organization
export const deleteOrganization = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const org = await Organization.findByIdAndDelete(id);

        if (!org) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        res.json({ message: 'Organization deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting organization', error });
    }
};

// Get Recent Transactions (Payments)
export const getRecentTransactions = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 5;
        const search = req.query.search as string || '';

        const query: any = {};
        
        if (search) {
            // Search by student email, org name, status, or amount
            const Student = (await import('../models/Student.js')).default;
            
            const orgs = await Organization.find({ orgName: { $regex: search, $options: 'i' } }).select('_id');
            const orgIds = orgs.map(org => org._id);

            const students = await Student.find({ email: { $regex: search, $options: 'i' } }).select('_id');
            const studentIds = students.map(s => s._id);
            
            const statusMatch = ['pending', 'completed', 'failed'].includes(search.toLowerCase()) ? search.toLowerCase() : null;
            const amountMatch = !isNaN(Number(search)) ? Number(search) : null;

            const orConditions: any[] = [];
            if (statusMatch) orConditions.push({ status: statusMatch });
            if (orgIds.length > 0) orConditions.push({ organizationId: { $in: orgIds } });
            if (studentIds.length > 0) orConditions.push({ studentId: { $in: studentIds } });
            if (amountMatch !== null) orConditions.push({ amount: amountMatch });

            if (orConditions.length > 0) {
                query.$or = orConditions;
            } else {
                return res.json({
                    data: [],
                    pagination: { total: 0, page, limit, totalPages: 0, startIndex: 0, endIndex: 0 }
                });
            }
        }

        const total = await Payment.countDocuments(query);
        const payments = await Payment.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('organizationId', 'orgName email')
            .populate('studentId', 'studentName email');

        res.json({
            data: payments,
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
        res.status(500).json({ message: 'Error fetching transactions', error });
    }
};

