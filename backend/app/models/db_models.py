"""
SQLAlchemy ORM Models for CI Bottleneck Analyser.
Stores Builds, Bottlenecks, and Recommendations with Evidence.
"""
from sqlalchemy import Column, Integer, Float, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class Build(Base):
    __tablename__ = "builds"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    build_id = Column(String(64), index=True, nullable=False)
    pipeline_id = Column(String(64), index=True, nullable=False)
    task_name = Column(String(128), nullable=False)
    task_category = Column(String(64), nullable=False)
    task_duration_seconds = Column(Float, nullable=False)
    queue_time_seconds = Column(Float, nullable=False)
    cache_hits = Column(Integer, default=0)
    cache_misses = Column(Integer, default=0)
    cache_hit_rate = Column(Float, default=1.0)
    agent_utilisation_percent = Column(Float, default=0.0)
    number_of_tasks = Column(Integer, default=1)
    failed_tasks = Column(Integer, default=0)
    parallelizable_tasks = Column(Integer, default=0)
    build_duration_seconds = Column(Float, nullable=False)
    build_status = Column(String(32), default="SUCCESS")
    bottleneck_label = Column(Integer, default=0)
    bottleneck_type = Column(String(64), default="NONE")
    severity = Column(String(32), default="NONE")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    bottlenecks = relationship("Bottleneck", back_populates="build", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="build", cascade="all, delete-orphan")

class Bottleneck(Base):
    __tablename__ = "bottlenecks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    build_id = Column(String(64), ForeignKey("builds.build_id"), index=True, nullable=False)
    problem = Column(String(64), nullable=False)
    severity = Column(String(32), nullable=False)
    observed_value = Column(String(128), nullable=False)
    threshold = Column(String(128), nullable=False)
    recommendation = Column(Text, nullable=False)
    estimated_impact = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    build = relationship("Build", back_populates="bottlenecks", foreign_keys=[build_id], primaryjoin="Build.build_id == Bottleneck.build_id")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    recommendation_id = Column(String(64), unique=True, index=True, nullable=False)
    build_id = Column(String(64), ForeignKey("builds.build_id"), index=True, nullable=False)
    problem = Column(String(64), nullable=False)
    severity = Column(String(32), nullable=False)
    observed_value = Column(String(128), nullable=False)
    threshold = Column(String(128), nullable=False)
    recommendation = Column(Text, nullable=False)
    evidence_json = Column(Text, nullable=False)  # JSON serialized dictionary
    estimated_impact = Column(Text, nullable=True)
    
    # 4-Question Explainability columns
    what_happened = Column(Text, nullable=False)
    why_it_matters = Column(Text, nullable=False)
    what_to_do = Column(Text, nullable=False)
    evidence_supports = Column(Text, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    build = relationship("Build", back_populates="recommendations", foreign_keys=[build_id], primaryjoin="Build.build_id == Recommendation.build_id")
