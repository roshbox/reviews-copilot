import React from "react";

export default function Pagination({ page = 1, pageSize = 5, total = 0, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
      <button
        className="button small"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
      >
        Prev
      </button>
      <div>
        Page {page} / {totalPages}
      </div>
      <button
        className="button small"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
      >
        Next
      </button>
    </div>
  );
}
