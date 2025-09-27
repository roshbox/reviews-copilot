from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session
from .models import Review
from .database import SessionLocal
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from google.genai import Client
import re
import os
from dotenv import load_dotenv
import string

# Loading environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env")

router = APIRouter()



# Dependencies 
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_api_key(x_api_key: str | None = Header(None)):
    if x_api_key != "changeme":
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return x_api_key

#  Helper functions 
def sanitize_text(text: str):
    text = re.sub(r'\S+@\S+', '[REDACTED_EMAIL]', text)
    text = re.sub(r'\b\d{10,15}\b', '[REDACTED_PHONE]', text)
    return text

def normalize_sentiment(text: str) -> str:
    text = text.lower().translate(str.maketrans('', '', string.punctuation))
    if "positive" in text:
        return "positive"
    elif "negative" in text:
        return "negative"
    elif "neutral" in text:
        return "neutral"
    return "unknown"

def assign_topic_dynamic(text: str, db: Session, top_n: int = 1):
    corpus = [r.text for r in db.query(Review).all()]
    corpus.append(text)
    vectorizer = TfidfVectorizer(stop_words='english')
    X = vectorizer.fit_transform(corpus)
    scores = X.toarray()[-1]
    feature_names = vectorizer.get_feature_names_out()
    top_indices = scores.argsort()[::-1][:top_n]
    topics = [feature_names[i] for i in top_indices if scores[i] > 0]
    return topics[0] if topics else "general"

# Pydantic models 
class ReviewIn(BaseModel):
    id: int
    location: str
    rating: int
    text: str
    date: date


# --- 0. Health ---
@router.get("/health")
def health():
    return {"status": "ok"}

# --- 1. Ingest reviews ---
@router.post("/ingest")
def ingest_reviews(
    reviews: List[ReviewIn],
    reset: bool = False,
    api_key: str = Depends(get_api_key),
    db: Session = Depends(get_db)
):
    client = Client(api_key=GEMINI_API_KEY)

    if reset:
        db.query(Review).delete()
        db.commit()

    added = 0
    for r in reviews:
        exists = db.query(Review).filter(Review.id == r.id).first()
        if exists:
            continue

        text = sanitize_text(r.text)
        if not text.strip():
            text = "No review text provided."

        sentiment_prompt = f"""
Analyze the sentiment of the following text.
ONLY respond with one word: positive, negative, or neutral.
Text: {text}
"""
        sentiment_response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=sentiment_prompt
        )
        sentiment = normalize_sentiment(sentiment_response.text.strip())

        topic = assign_topic_dynamic(text, db=db)

        review = Review(
            id=r.id,
            location=r.location,
            rating=r.rating,
            text=r.text,
            date=r.date,
            sentiment=sentiment,
            topic=topic
        )
        db.add(review)
        added += 1

    db.commit()


    return {"ingested": added, "reset": reset}

# --- 2. Browse & search ---
@router.get("/reviews")
def list_reviews(
    location: Optional[str] = None,
    sentiment: Optional[str] = None,
    q: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
    api_key: str = Depends(get_api_key),
    db: Session = Depends(get_db)
):
    query = db.query(Review)
    if location:
        query = query.filter(Review.location == location)
    if sentiment:
        query = query.filter(Review.sentiment == sentiment)
    if q:
        query = query.filter(Review.text.ilike(f"%{q}%"))

    total = query.count()
    reviews = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "reviews": [
            {
                "id": r.id,
                "location": r.location,
                "rating": r.rating,
                "text": r.text,
                "date": str(r.date),
                "sentiment": r.sentiment,
                "topic": r.topic
            }
            for r in reviews
        ]
    }

# --- 3. Single review ---
@router.get("/reviews/{id}")
def get_review(
    id: int,
    api_key: str = Depends(get_api_key),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return {
        "id": review.id,
        "location": review.location,
        "rating": review.rating,
        "text": review.text,
        "date": str(review.date),
        "sentiment": review.sentiment,
        "topic": review.topic
    }

# --- 4. Suggested reply ---
@router.post("/reviews/{id}/suggest-reply")
def suggest_reply(
    id: int,
    api_key: str = Depends(get_api_key),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    text = sanitize_text(review.text)
    if not text.strip():
        text = "No review text provided."

    client = Client(api_key=GEMINI_API_KEY)

    sentiment_prompt = f"""
Analyze the sentiment of the following text.
ONLY respond with one word: positive, negative, or neutral.
Text: {text}
"""
    sentiment_raw = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=sentiment_prompt
    ).text.strip()
    sentiment = normalize_sentiment(sentiment_raw)

    topic = assign_topic_dynamic(text, db=db)

    reply_prompt = f"""
You are a customer support assistant.
Write a concise, empathetic, and polite reply to the customer review below.
Consider the sentiment ({sentiment}) and the main topic ({topic}) of the review.
Do not include personal info or emails or toxic language.
Review: {text}
"""
    reply = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=reply_prompt
    ).text.strip()

    review.sentiment = sentiment
    review.topic = topic
    db.commit()

    return {
        "reply": reply,
        "tags": {"sentiment": sentiment, "topic": topic},
        "reasoning_log": {
            "sentiment_raw": sentiment_raw,
            "sentiment_normalized": sentiment,
            "topic_extracted": topic
        }
    }

# --- 5. Analytics ---
@router.get("/analytics")
def get_analytics(
    api_key: str = Depends(get_api_key),
    db: Session = Depends(get_db)
):
    reviews = db.query(Review).all()
    if not reviews:
        return {"sentiment_counts": {}, "topic_counts": {}}

    sentiment_counts = {}
    topic_counts = {}
    for r in reviews:
        sentiment_counts[r.sentiment or "unknown"] = sentiment_counts.get(r.sentiment or "unknown", 0) + 1
        topic_counts[r.topic or "unknown"] = topic_counts.get(r.topic or "unknown", 0) + 1

    return {"sentiment_counts": sentiment_counts, "topic_counts": topic_counts}

# --- 6. Search / RAG-lite ---
@router.get("/search")
def search_reviews(
    q: str,
    k: int = 5,
    api_key: str = Depends(get_api_key),
    db: Session = Depends(get_db)
):
    if not q:
        raise HTTPException(status_code=400, detail="Query 'q' is required")

    reviews = db.query(Review).all()
    if not reviews:
        return {"results": []}

    corpus = [r.text for r in reviews]
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)
    query_vec = vectorizer.transform([q])
    similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
    top_k_idx = similarities.argsort()[::-1][:k]

    results = []
    for idx in top_k_idx:
        r = reviews[idx]
        results.append({
            "id": r.id,
            "location": r.location,
            "rating": r.rating,
            "text": r.text,
            "date": str(r.date),
            "sentiment": r.sentiment,
            "topic": r.topic,
            "score": float(similarities[idx])
        })

    return {"results": results}
