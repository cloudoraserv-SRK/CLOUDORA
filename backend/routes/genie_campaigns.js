import express from "express";
import {
  dispatchViaMlBlaster,
  fetchBlastContacts,
  generateBlastContent,
  normalizeCampaignRequest
} from "../lib/genieCampaigns.js";
import { getMemberFromRequest } from "../lib/genieAccess.js";
import {
  enforceTrialAccess,
  getClientIdFromRequest,
  logCampaignRun,
  logGenieUsage
} from "../lib/genieUsage.js";

const router = express.Router();

function hasBlastAccess(req) {
  return Boolean(getMemberFromRequest(req)?.fullAccess);
}

router.post("/prepare-email-blast", async (req, res) => {
  try {
    const member = getMemberFromRequest(req);
    const clientId = getClientIdFromRequest(req);
    const access = await enforceTrialAccess({
      member,
      clientId,
      actionType: "campaign"
    });

    if (!hasBlastAccess(req) || !access.ok) {
      return res.status(403).json({
        ok: false,
        error: access.error || "Full Genie access is required for email blast workflows"
      });
    }

    const payload = normalizeCampaignRequest(req.body || {});
    const contacts = await fetchBlastContacts(payload);
    const campaign = await generateBlastContent(payload);
    await logGenieUsage({
      member,
      clientId,
      actionType: "campaign_prepare",
      status: "success",
      meta: { contactsFound: contacts.length }
    });
    await logCampaignRun({
      member,
      clientId,
      campaignType: "email_blast",
      status: "prepared",
      contactsFound: contacts.length,
      payload: {
        source: payload.source,
        objective: payload.objective,
        businessName: payload.businessProfile?.businessName || ""
      }
    });

    return res.json({
      ok: true,
      contactsFound: contacts.length,
      contacts,
      campaign
    });
  } catch (error) {
    console.error("prepare-email-blast error", error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

router.post("/run-email-blast", async (req, res) => {
  try {
    const member = getMemberFromRequest(req);
    const clientId = getClientIdFromRequest(req);
    const access = await enforceTrialAccess({
      member,
      clientId,
      actionType: "campaign"
    });

    if (!hasBlastAccess(req) || !access.ok) {
      return res.status(403).json({
        ok: false,
        error: access.error || "Full Genie access is required for email blast workflows"
      });
    }

    const payload = normalizeCampaignRequest(req.body || {});
    const contacts = await fetchBlastContacts(payload);
    const campaign = await generateBlastContent(payload);

    if (!payload.dispatch) {
      await logGenieUsage({
        member,
        clientId,
        actionType: "campaign_preview",
        status: "success",
        meta: { contactsFound: contacts.length }
      });
      await logCampaignRun({
        member,
        clientId,
        campaignType: "email_blast",
        status: "previewed",
        contactsFound: contacts.length,
        payload: {
          source: payload.source,
          objective: payload.objective
        }
      });
      return res.json({
        ok: true,
        contactsFound: contacts.length,
        contacts,
        campaign,
        dispatched: false
      });
    }

    const dispatchResult = await dispatchViaMlBlaster({
      mlblasterUrl: payload.mlblasterUrl,
      contacts,
      campaign,
      senderProfile: payload.businessProfile
    });
    await logGenieUsage({
      member,
      clientId,
      actionType: "campaign_dispatch",
      status: "success",
      meta: {
        contactsFound: contacts.length,
        sent: dispatchResult.sent,
        failed: dispatchResult.failed
      }
    });
    await logCampaignRun({
      member,
      clientId,
      campaignType: "email_blast",
      status: "dispatched",
      contactsFound: contacts.length,
      sentCount: dispatchResult.sent,
      failedCount: dispatchResult.failed,
      payload: {
        source: payload.source,
        objective: payload.objective,
        mlblasterUrl: dispatchResult.baseUrl
      }
    });

    return res.json({
      ok: true,
      contactsFound: contacts.length,
      campaign,
      dispatched: true,
      dispatchResult
    });
  } catch (error) {
    console.error("run-email-blast error", error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

export default router;
