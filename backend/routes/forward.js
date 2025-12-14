import express from "express";
import { sendMail } from "../utils/mailer.js";
import { supabase } from "../api/supabase.js";

const router = express.Router();

router.post("/forward-sales", async (req, res) => {
    const { lead_id, forwarded_by } = req.body;

    try {
        const { data: lead } = await supabase
            .from("scraped_leads")
            .select("*")
            .eq("id", lead_id)
            .single();

        if (!lead) return res.json({ ok: false, error: "Lead not found" });

        // Email content
        const html = `
            <h2>New Interested Lead Forwarded to Sales Team</h2>
            <p><b>Name:</b> ${lead.name}</p>
            <p><b>Phone:</b> ${lead.phone}</p>
            <p><b>Category:</b> ${lead.category}</p>
            <p><b>City:</b> ${lead.city}</p>
            <p><b>Forwarded by Employee ID:</b> ${forwarded_by}</p>
            <br>
            <p>Login to CRM to take action.</p>
        `;

        // SEND to sales (for now support@cloudoraserv.cloud)
        await sendMail("support@cloudoraserv.cloud", "New Interested Lead", html);

        return res.json({ ok: true });

    } catch (err) {
        console.error("FORWARD SALES ERROR:", err);
        return res.json({ ok: false, error: err.message });
    }
});

export default router;
