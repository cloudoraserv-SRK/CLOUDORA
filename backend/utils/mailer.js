import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
        user: "support@cloudoraserv.cloud",
        pass: process.env.SMTP_PASSWORD
    }
});

/**
 * Universal mail sender
 */
export async function sendMail(to, subject, html) {
    try {
        const info = await transporter.sendMail({
            from: `"Cloudora CRM" <support@cloudoraserv.cloud>`,
            to,
            subject,
            html
        });

        console.log("MAIL SENT →", info.messageId);
        return { ok: true };
    } catch (err) {
        console.error("MAIL ERROR:", err);
        return { ok: false, error: err.message };
    }
}

/**
 * ⭐ Special: Send email to Sales team when lead is interested
 */
export async function sendSalesEmail(lead, forwarded_by) {
    const html = `
        <h2>🔥 New INTERESTED Lead Forwarded to Sales</h2>

        <p><b>Name:</b> ${lead.name}</p>
        <p><b>Phone:</b> ${lead.phone}</p>
        <p><b>City:</b> ${lead.city}</p>
        <p><b>Category:</b> ${lead.category}</p>
        <p><b>Status:</b> Interested</p>
        <br>
        <p><b>Forwarded by Employee:</b> ${forwarded_by}</p>

        <hr>
        <p>Login CRM to follow-up: https://cloudora.cloud/dashboard</p>
    `;

    return await sendMail("support@cloudoraserv.cloud", "🔥 New Interested Lead", html);
}
