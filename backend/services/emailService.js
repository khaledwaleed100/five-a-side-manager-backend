import nodemailer from 'nodemailer';

/**
 * Email Service using Nodemailer (Gmail)
 * Sends transactional emails to match managers.
 */

let transporter = null;

function getTransporter() {
    if (!transporter) {
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
        
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });
    }
    return transporter;
}

/**
 * Send a match creation confirmation email to the manager.
 * Non-throwing — failures are logged but never break the main flow.
 */
export async function sendMatchCreationEmail(user, match) {
    const mailTransporter = getTransporter();
    
    if (!mailTransporter) {
        return; // Email not configured — silently skip
    }

    try {
        const matchDate = new Date(match.date).toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const mailOptions = {
            from: `"Five-a-Side Manager" <${process.env.GMAIL_USER}>`,
            to: user.email,
            subject: `⚽ New Match Scheduled — ${matchDate}`,
            html: `
                <div style="font-family: Inter, sans-serif; max-width: 600px; margin: auto; background: #0D1B2E; color: #EFF6FF; padding: 32px; border-radius: 12px;">
                    <h1 style="color: #3B82F6; margin-bottom: 4px;">Match Scheduled ✅</h1>
                    <p style="color: #6B8FA8;">Hi ${user.name || 'Manager'},</p>
                    <p>Your match has been successfully created. Here are the details:</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                        <tr><td style="padding: 8px; color: #6B8FA8;">📍 Place</td><td style="padding: 8px; font-weight: bold;">${match.place}</td></tr>
                        <tr><td style="padding: 8px; color: #6B8FA8;">📅 Date</td><td style="padding: 8px; font-weight: bold;">${matchDate}</td></tr>
                        <tr><td style="padding: 8px; color: #6B8FA8;">🕐 Time</td><td style="padding: 8px; font-weight: bold;">${match.time}</td></tr>
                    </table>
                    <p style="margin-top: 24px; color: #6B8FA8; font-size: 14px;">Manage your match on the Five-a-Side Manager app.</p>
                </div>
            `
        };

        await mailTransporter.sendMail(mailOptions);
        console.log(`📧 Match confirmation email sent to ${user.email} via Gmail`);
    } catch (err) {
        console.error('Email send failed (non-critical):', err.message);
    }
}
