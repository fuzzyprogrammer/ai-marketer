-- AI Marketer Database Schema
-- Run this after creating the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_description TEXT,
    long_description TEXT,
    categories JSONB DEFAULT '[]',
    tone VARCHAR(100),
    audience JSONB DEFAULT '[]',
    website_url TEXT,
    logo_url TEXT,
    key_products JSONB DEFAULT '[]',
    canonical_pages JSONB DEFAULT '[]',
    contact_email VARCHAR(255),
    extracted_keywords JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    brand_id UUID REFERENCES brands(id),
    data JSONB DEFAULT '{}',
    result JSONB,
    error TEXT,
    retries INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content drafts table
CREATE TABLE IF NOT EXISTS content_drafts (
    id VARCHAR(255) PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES brands(id),
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
    id VARCHAR(255) PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES brands(id),
    content_id VARCHAR(255) NOT NULL REFERENCES content_drafts(id),
    channels JSONB NOT NULL DEFAULT '[]',
    scheduled_at TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    platform_post_ids JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES brands(id),
    content_id VARCHAR(255) REFERENCES content_drafts(id),
    channel VARCHAR(50),
    metric_type VARCHAR(50),
    metric_value DECIMAL(15, 4),
    event_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_brand_id ON jobs(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_drafts_brand_id ON content_drafts(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_drafts_status ON content_drafts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_brand_id ON scheduled_posts(brand_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_analytics_brand_id ON analytics(brand_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON scheduled_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
