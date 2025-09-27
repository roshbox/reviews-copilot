import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import SuggestReply from "../components/SuggestReply";

export default function ReviewDetail() {
  const { id } = useParams();
  const [review, setReview] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [showSimilar, setShowSimilar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReview = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReview(id);
      setReview(data);
    } catch (e) {
      setError(e.message || "Failed to load review");
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilar = async () => {
    if (!review) return;
    try {
      const res = await api.search(review.text, 5);
      setSimilar(res.results || []);
      setShowSimilar(true);
    } catch (e) {
      alert("Search failed: " + e.message);
    }
  };

  useEffect(() => {
    fetchReview();
  }, [id]);

  return (
    <div className="review-detail">
      <button className="button small" onClick={() => window.history.back()}>
        Back
      </button>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}

      {review && (
        <>
          <div className="card mt-4">
            <h2>Review #{review.id}</h2>
            <div><strong>Location:</strong> {review.location}</div>
            <div><strong>Rating:</strong> {review.rating}</div>
            <div><strong>Sentiment:</strong> {review.sentiment}</div>
            <div><strong>Topic:</strong> {review.topic}</div>
            <div style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
              <strong>Text:</strong>
              <div style={{ marginTop: 6 }}>{review.text}</div>
            </div>

            <div style={{ marginTop: 18 }}>
              <SuggestReply id={review.id} onCompleted={fetchReview} />
            </div>

            <div style={{ marginTop: 18 }}>
              <button
                className="button small outline"
                onClick={fetchSimilar}
              >
                Find similar reviews
              </button>
            </div>
          </div>

          {showSimilar && (
            <div className="card mt-4">
              <h3>Similar Reviews</h3>
              {similar.length === 0 ? (
                <p className="muted">No similar reviews found.</p>
              ) : (
                <table className="similar-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Location</th>
                      <th>Rating</th>
                      <th>Text</th>
                    </tr>
                  </thead>
                  <tbody>
                    {similar.map((r) => (
                      <tr key={r.id}>
                        <td>#{r.id}</td>
                        <td>{r.location}</td>
                        <td>{r.rating}★</td>
                        <td>{r.text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
