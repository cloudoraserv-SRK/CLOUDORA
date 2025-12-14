import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
        user: "support@cloudoraserv.cloud",   // your Hostinger mailbox
        pass: process.env.SMTP_PASSWORD       // keep password in env
    }
});

/**
 * Send email (universal function)
 */
export async function sendMail(to, subject, html) {
    try {
        const info = await mailer.sendMail({
            from: `"Cloudora Sales" <support@cloudoraserv.cloud>`,
            to,
            subject,
            html
        });

        console.log("MAIL SENT:", info.messageId);
        return { ok: true };
    } catch (err) {
        console.error("MAIL ERROR:", err);
        return { ok: false, error: err.message };
    }
}
