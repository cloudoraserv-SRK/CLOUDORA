// -------------------------------------------------------
// Cloudora SERP Worker (FULL ESM VERSION)
// -------------------------------------------------------

import axios from "axios";

export default {
    extract: async function (category, city) {
        try {
            const query = `${category} in ${city}`;

            const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(
                query
            )}&hl=en&api_key=${process.env.SERP_API_KEY}`;

            const response = await fetch(url);
            const data = await response.json();

            const results = data.local_results || [];

            return results.map(r => ({
                name: r.title || null,
                phone: r.phone || null,
                address: r.address || null,
                website: r.website || null,
                email: r.emails?.[0] || null
            }));

        } catch (err) {
            console.log("SERP WORKER ERROR:", err);
            return [];
        }
    }
};

