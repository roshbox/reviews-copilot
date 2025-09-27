import React, { useEffect, useState, useRef } from "react";
import { api } from "../api";
import { debounce } from "../utils";
import ReviewTable from "../components/ReviewTable";
import Pagination from "../components/Pagination";

export default function Inbox() {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [jsonInput, setJsonInput] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchData = async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getReviews({
        location,
        sentiment,
        q,
        page: p,
        page_size: pageSize,
      });
      setReviews(res.reviews || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e.message || "Failed to load");
      setReviews([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSetQ = useRef(
    debounce((v) => {
      setQ(v);
      setPage(1);
    }, 350)
  ).current;

  useEffect(() => {
    fetchData(page);
  }, [location, sentiment, q, page]);

  const clearTable = async () => {
    try {
      setLoading(true);
      await api.ingest([], true); // reset = true → clear backend
      setReviews([]);
      setTotal(0);
      setPage(1);
    } catch (e) {
      setError(e.message || "Failed to clear reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async (parsed) => {
    try {
      setUploading(true);
      if (!Array.isArray(parsed)) {
        alert("Input must be a JSON array of reviews");
        return;
      }
      await api.ingest(parsed, false);
      setJsonInput("");
      await fetchData(1); // reload first page after ingest
    } catch (e) {
      alert("Upload failed: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleJsonSubmit = () => {
    if (!jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(jsonInput);
      handleIngest(parsed);
    } catch (e) {
      alert("Invalid JSON: " + e.message);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = JSON.parse(text);
        handleIngest(parsed);
      } catch (err) {
        alert("Invalid JSON in file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <div className="filters">
        <input
          placeholder="Search text..."
          onChange={(e) => debouncedSetQ(e.target.value)}
        />
        <input
          placeholder="Location (NYC / SF...)"
          onChange={(e) => {
            setLocation(e.target.value);
            setPage(1);
          }}
        />
        <select
          onChange={(e) => {
            setSentiment(e.target.value);
            setPage(1);
          }}
          defaultValue=""
        >
          <option value="">All sentiments</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
        <button className="button small" onClick={() => fetchData(1)}>
          Refresh
        </button>
        <button className="button small danger" onClick={clearTable}>
          Clear Table
        </button>
      </div>

      <div className="json-upload" style={{ margin: "1rem 0" }}>
        <textarea
          rows={6}
          style={{ width: "100%" }}
          placeholder='Paste JSON array of reviews here OR use the file upload below'
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />
        <button
          className="button"
          onClick={handleJsonSubmit}
          disabled={uploading}
          style={{ marginTop: "0.5rem", marginRight: "0.5rem" }}
        >
          {uploading ? "Uploading…" : "Add Reviews (from text)"}
        </button>

        <input
          type="file"
          accept=".json,application/json"
          onChange={handleFileUpload}
          style={{ marginTop: "0.5rem" }}
        />
      </div>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}

      <ReviewTable reviews={reviews} />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onChange={(p) => setPage(p)}
      />
    </div>
  );
}
