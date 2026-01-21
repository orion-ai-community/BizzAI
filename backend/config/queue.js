/**
 * Background Job Queue Configuration
 * Uses Bull + Redis for async email and PDF generation
 * 
 * Setup:
 * 1. Install: npm install bull ioredis
 * 2. Start Redis: docker run -d -p 6379:6379 redis:alpine
 * 3. Set REDIS_URL in .env
 */

import Bull from 'bull';

// Redis connection configuration
const redisConfig = {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: 3,
    },
};

// Email queue for async email sending
export const emailQueue = new Bull('email', redisConfig);

// PDF queue for async PDF generation
export const pdfQueue = new Bull('pdf', redisConfig);

// Configure queue options
const queueOptions = {
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2s delay, exponentially increase
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200, // Keep last 200 failed jobs
};

// Email job processor
emailQueue.process(async (job) => {
    const { to, subject, html, text } = job.data;

    // Import email service dynamically to avoid circular dependencies
    const { sendHtmlEmail } = await import('../utils/emailService.js');

    try {
        await sendHtmlEmail(to, subject, html, text);
        return { success: true, to, subject };
    } catch (error) {
        throw new Error(`Email send failed: ${error.message}`);
    }
});

// PDF job processor
pdfQueue.process(async (job) => {
    const { type, data } = job.data;

    // Import PDF generator dynamically
    const { generateInvoicePDF } = await import('../utils/pdfGenerator.js');

    try {
        let pdfBuffer;

        switch (type) {
            case 'invoice':
                pdfBuffer = await generateInvoicePDF(data);
                break;
            // Add more PDF types as needed
            default:
                throw new Error(`Unknown PDF type: ${type}`);
        }

        return { success: true, type, size: pdfBuffer.length };
    } catch (error) {
        throw new Error(`PDF generation failed: ${error.message}`);
    }
});

// Queue event listeners
emailQueue.on('completed', (job, result) => {
    console.log(`✅ Email job ${job.id} completed:`, result);
});

emailQueue.on('failed', (job, err) => {
    console.error(`❌ Email job ${job.id} failed:`, err.message);
});

pdfQueue.on('completed', (job, result) => {
    console.log(`✅ PDF job ${job.id} completed:`, result);
});

pdfQueue.on('failed', (job, err) => {
    console.error(`❌ PDF job ${job.id} failed:`, err.message);
});

// Helper functions to add jobs
export const queueEmail = async (to, subject, html, text = '') => {
    return await emailQueue.add(
        { to, subject, html, text },
        queueOptions
    );
};

export const queuePDF = async (type, data) => {
    return await pdfQueue.add(
        { type, data },
        queueOptions
    );
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('📦 Closing job queues...');
    await emailQueue.close();
    await pdfQueue.close();
    console.log('✅ Job queues closed');
});

export default { emailQueue, pdfQueue, queueEmail, queuePDF };
