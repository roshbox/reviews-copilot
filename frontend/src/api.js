// src/api.js
const RAW_API_ROOT = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_ROOT = RAW_API_ROOT.replace(/\/$/, "") + "/api";
const API_KEY = import.meta.env.VITE_API_KEY || "changeme";

function buildQuery(params = {}) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, v);
  });
  return p.toString();
}

async function request(path, { method = "GET", body, headers = {} } = {}) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      ...headers,
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_ROOT}${path}`, opts);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    throw new Error("Invalid JSON response");
  }

  if (!res.ok) {
    const err = new Error(data?.detail || res.statusText || "Request failed");
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export const api = {
  ingest: (reviews = [], reset = false) =>
    request(`/ingest?reset=${reset}`, { method: "POST", body: reviews }),

  getReviews: ({ location, sentiment, q, page = 1, page_size = 10 } = {}) => {
    const qstr = buildQuery({ location, sentiment, q, page, page_size });
    return request(`/reviews?${qstr}`);
  },

  getReview: (id) => request(`/reviews/${id}`),

  suggestReply: (id) =>
    request(`/reviews/${id}/suggest-reply`, { method: "POST" }),

  analytics: () => request(`/analytics`),

  search: (q, k = 5) =>
    request(`/search?q=${encodeURIComponent(q)}&k=${k}`),

  health: () => request("/health"),
};
