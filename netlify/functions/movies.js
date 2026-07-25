// netlify/functions/movies.js
// Real shared "database" for CineStream movies, using Netlify Blobs.
// GET  -> returns the current movie list (public, no key needed)
// POST -> overwrites the movie list (requires x-admin-key header to match ADMIN_SECRET)

import { getStore } from "@netlify/blobs";

// IMPORTANT: set this in Netlify dashboard -> Site settings -> Environment variables
// as ADMIN_SECRET, with the SAME value as ADMIN_PASS in the HTML file.
// If not set, it falls back to the value below (change this too if you don't set the env var).
const ADMIN_SECRET = process.env.ADMIN_SECRET || "Baorami@22";

export default async (req) => {
  const store = getStore("cinestream");

  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method === "GET") {
    const data = await store.get("movies", { type: "json" });
    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method === "POST") {
    const key = req.headers.get("x-admin-key");
    if (key !== ADMIN_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    await store.set("movies", JSON.stringify(body));
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: corsHeaders,
  });
};

export const config = {
  path: "/api/movies",
};
