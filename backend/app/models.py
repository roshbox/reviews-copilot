from sqlalchemy import Column, Integer, String, Date, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    location = Column(String, index=True)
    rating = Column(Integer)
    text = Column(Text)
    date = Column(Date)
    sentiment = Column(String, nullable=True)  # will fill later
    topic = Column(String, nullable=True)      # coarse topic tag
