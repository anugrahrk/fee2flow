import fs from 'fs';
import path from 'path';
import Payment from '../models/Payment.js';

const UPLOAD_DIR = path.join(process.cwd(), 'upload');
const FILE_AGE_LIMIT = 24 * 60 * 60 * 1000; // 24 hours
const PAYMENT_STALE_LIMIT = 15 * 60 * 1000; // 15 minutes

export const initCronJobs = () => {
    // Run cleanup immediately on startup
    cleanupOldFiles();
    cleanupStalePayments();

    // Schedule cleanup every hour
    setInterval(cleanupOldFiles, 60 * 60 * 1000);
    
    // Schedule payment cleanup every 5 minutes
    setInterval(cleanupStalePayments, 5 * 60 * 1000);
    
    console.log('Cron jobs initialized: File cleanup and Payment cleanup scheduled.');
};

const cleanupOldFiles = () => {
    try {
        if (!fs.existsSync(UPLOAD_DIR)) {
            return;
        }

        fs.readdir(UPLOAD_DIR, (err, files) => {
            if (err) {
                console.error('Error reading upload directory for cleanup:', err);
                return;
            }

            const now = Date.now();

            files.forEach(file => {
                const filePath = path.join(UPLOAD_DIR, file);
                fs.stat(filePath, (err, stats) => {
                    if (err) {
                        console.error(`Error getting stats for file ${file}:`, err);
                        return;
                    }

                    if (now - stats.mtimeMs > FILE_AGE_LIMIT) {
                        fs.unlink(filePath, (err) => {
                            if (err) {
                                console.error(`Error deleting file ${file}:`, err);
                            } else {
                                console.log(`Deleted old file: ${file}`);
                            }
                        });
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error during file cleanup:', error);
    }
};

const cleanupStalePayments = async () => {
    try {
        const staleThreshold = new Date(Date.now() - PAYMENT_STALE_LIMIT);
        
        const result = await Payment.updateMany(
            { 
                status: 'pending', 
                createdAt: { $lt: staleThreshold } 
            },
            { 
                $set: { status: 'failed' } 
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`[Cron] Marked ${result.modifiedCount} stale pending payments as failed.`);
        }
    } catch (error) {
        console.error('[Cron] Error cleaning up stale payments:', error);
    }
};
