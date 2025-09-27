import React from "react";
import { useNavigate } from "react-router-dom";

export default function ReviewTable({ reviews = [] }) {
  const nav = useNavigate();
  return (
    <table className="table">
      <thead>
        <tr>
          <th>ID</th><th>Location</th><th>Rating</th><th>Sentiment</th><th>Topic</th><th>Text</th>
        </tr>
      </thead>
      <tbody>
        {reviews.map((r) => (
          <tr key={r.id} className="row-clickable" onClick={() => nav(`/reviews/${r.id}`)}>
            <td>{r.id}</td>
            <td>{r.location}</td>
            <td>{r.rating}</td>
            <td>{r.sentiment}</td>
            <td>{r.topic}</td>
            <td>{r.text?.length > 140 ? r.text.slice(0, 140) + "…" : r.text}</td>
          </tr>
        ))}
        {reviews.length === 0 && (
          <tr><td colSpan="6" style={{ color: "#777" }}>No reviews</td></tr>
        )}
      </tbody>
    </table>
  );
}
