import React, { useState } from "react";
import { api } from "../api";
import { redactPII, copyToClipboard } from "../utils";

export default function SuggestReply({ id, onCompleted }) {
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [tags, setTags] = useState(null);
  const [log, setLog] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleSuggest() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.suggestReply(id);
      const safeReply = redactPII(data.reply || "");
      setReply(safeReply);
      setTags(data.tags);
      setLog(data.reasoning_log);
      if (onCompleted) onCompleted();
    } catch (e) {
      setError(e.message || "Failed to suggest reply");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    copyToClipboard(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // reset after 2s
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="button" onClick={handleSuggest} disabled={loading}>
          {loading ? "Generating…" : "Suggest reply"}
        </button>
      </div>

      {error && <div style={{ color: "red" }}>{error}</div>}

      {reply && (
        <div style={{ marginTop: 12 }}>
          {/* Header row with title and copy */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <h4 style={{ margin: 0 }}>Suggested reply (editable)</h4>
            <span
              onClick={handleCopy}
              style={{ cursor: "pointer", fontSize: 14, color: copied ? "green" : "#111827" }}
              title="Copy to clipboard"
            >
              {copied ? "Copied!" : "📋"}
            </span>
          </div>

          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={6}
            style={{
              width: "100%",
              backgroundColor: "#ffffff",
              color: "#111827",
              border: "1px solid #e5e7eb",
              borderRadius: "0.75rem",
              padding: "12px",
              fontSize: "14px",
              lineHeight: 1.5,
              resize: "vertical",
            }}
          />

          {tags && (
            <div style={{ marginTop: 8 }}>
              <strong>Tags:</strong> {tags.sentiment} / {tags.topic}
            </div>
          )}

          {log && (
            <details style={{ marginTop: 6 }}>
              <summary>Reasoning log</summary>
              <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(log, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
