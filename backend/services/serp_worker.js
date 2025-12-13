// -----------------------------------------------
// Cloudora SERP Worker (Google Maps / SERP API)
// -----------------------------------------------

import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function extract(category, city) {
  try {
    const query = `${category} in ${city}`;

    const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(
      query
    )}&hl=en&google_domain=google.com&api_key=${process.env.SERP_API_KEY}`;

    const response = await axios.get(url);

    const results = response.data.local_results || [];

    console.log("🔥 SERP RESULTS COUNT:", results.length);
    console.log("🔥 SAMPLE RESULT:", results[0]);

    return results.map((r) => ({
      name: r.title || null,
      phone: r.phone || null,
      address: r.address || null,
      website: r.website || null,
      email: r.emails ? r.emails[0] : null,
    }));
  } catch (err) {
    console.log("❌ SERP WORKER ERROR:", err.message);
    return [];
  }
}
