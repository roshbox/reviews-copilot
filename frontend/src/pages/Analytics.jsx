import React, { useEffect, useState } from "react";
import { api } from "../api";

function SimpleBarChart({ data = {}, width = 300, color = "#06b6d4" }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return <div>No data</div>;

  const max = Math.max(...entries.map(([, v]) => v));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {entries.map(([key, value]) => {
        const barWidth = (value / max) * width;
        return (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ minWidth: 60, fontWeight: 500 }}>{key}</span>
            <div
              style={{
                flex: "1 1 auto",
                height: 20,
                background: "#f3f4f6",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: barWidth,
                  height: "100%",
                  background: color,
                  borderRadius: 4,
                }}
              />
            </div>
            <span style={{ minWidth: 30, textAlign: "right", fontWeight: 500 }}>
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.analytics().then(setData).catch(e => setErr(e.message));
  }, []);

  if (err) return <div style={{ color: "red" }}>{err}</div>;
  if (!data) return <div>Loading…</div>;

  return (
    <div>
      <h2>Analytics</h2>
      <div
        style={{
          display: "flex",
          gap: 32,
          flexWrap: "wrap",
          marginTop: 16,
        }}
      >
        <div style={{ flex: "1 1 300px" }}>
          <h3>Sentiment counts</h3>
          <SimpleBarChart data={data.sentiment_counts || {}} color="var(--secondary)" />
        </div>
        <div style={{ flex: "1 1 300px" }}>
          <h3>Topic counts</h3>
          <SimpleBarChart data={data.topic_counts || {}} color="var(--tertiary)" />
        </div>
      </div>
    </div>
  );
}
