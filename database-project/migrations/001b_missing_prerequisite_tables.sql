-- ============================================================================
-- Missing Prerequisite Tables
-- ============================================================================
-- These tables existed in the production database but were not captured
-- in the initial schema migration. Required by migrations 002-019.
-- ============================================================================

-- ─── Divisions (organizational divisions) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.divisions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    ce_type VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── CE Users (Chief Engineer users) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ce_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255),
    email VARCHAR(255),
    ce_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing Zones ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.efiling_zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    ce_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing Zone Locations (town/district → zone mapping) ────────────────
CREATE TABLE IF NOT EXISTS public.efiling_zone_locations (
    id SERIAL PRIMARY KEY,
    zone_id INTEGER REFERENCES efiling_zones(id) ON DELETE CASCADE,
    district_id INTEGER REFERENCES districts(id),
    town_id INTEGER REFERENCES towns(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing SLA Matrix ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.efiling_sla_matrix (
    id SERIAL PRIMARY KEY,
    file_type_id INTEGER REFERENCES efiling_file_types(id),
    from_role_id INTEGER REFERENCES efiling_roles(id),
    to_role_id INTEGER REFERENCES efiling_roles(id),
    max_hours INTEGER,
    escalation_hours INTEGER,
    priority VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing Document Signatures ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.efiling_document_signatures (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES efiling_files(id) ON DELETE CASCADE,
    page_id INTEGER,
    user_id INTEGER REFERENCES efiling_users(id),
    signature_data TEXT,
    signature_type VARCHAR(50) DEFAULT 'DRAWN',
    position_x DECIMAL(10,2),
    position_y DECIMAL(10,2),
    width DECIMAL(10,2),
    height DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing User Signatures (saved per-user signature) ──────────────────
CREATE TABLE IF NOT EXISTS public.efiling_user_signatures (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES efiling_users(id) ON DELETE CASCADE,
    signature_data TEXT,
    signature_type VARCHAR(50) DEFAULT 'DRAWN',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing Workflow Stages ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.efiling_workflow_stages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    stage_name VARCHAR(255),
    role_id INTEGER REFERENCES efiling_roles(id),
    stage_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing Document Pages ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.efiling_document_pages (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES efiling_files(id) ON DELETE CASCADE,
    page_number INTEGER,
    content TEXT,
    page_type VARCHAR(50),
    created_by INTEGER REFERENCES efiling_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing File Workflows (extended) ───────────────────────────────────
-- Add missing columns to efiling_workflows that later migrations assume exist
ALTER TABLE efiling_workflows
ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP,
ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_stage_id INTEGER REFERENCES efiling_workflow_stages(id);

-- ─── Add sla_policy_id to efiling_file_types (needed by migration 015) ────
ALTER TABLE efiling_file_types
ADD COLUMN IF NOT EXISTS sla_policy_id INTEGER REFERENCES efiling_sla_policies(id);

-- ─── Add template_content to efiling_templates (needed by migration 008) ──
ALTER TABLE efiling_templates
ADD COLUMN IF NOT EXISTS template_content TEXT;

-- ─── Add category_id to efiling_templates (needed by migration 008 view) ──
ALTER TABLE efiling_templates
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES efiling_categories(id);

-- ─── Add division_id to complaint_types (needed by migration 005) ─────────
ALTER TABLE complaint_types
ADD COLUMN IF NOT EXISTS division_id INTEGER REFERENCES divisions(id);

-- ─── Rename role_id alias for efiling_users (view 018 uses efiling_role_id)
-- Actually role_id exists, we just add an alias column
-- Migration 018 references u.efiling_role_id, but table has role_id
-- We'll fix migration 018 instead

-- ─── Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_divisions_ce_type ON divisions(ce_type);
CREATE INDEX IF NOT EXISTS idx_efiling_zones_ce_type ON efiling_zones(ce_type);
CREATE INDEX IF NOT EXISTS idx_efiling_zone_locations_zone ON efiling_zone_locations(zone_id);
CREATE INDEX IF NOT EXISTS idx_efiling_zone_locations_town ON efiling_zone_locations(town_id);
CREATE INDEX IF NOT EXISTS idx_efiling_sla_matrix_file_type ON efiling_sla_matrix(file_type_id);
CREATE INDEX IF NOT EXISTS idx_efiling_document_pages_file ON efiling_document_pages(file_id);
CREATE INDEX IF NOT EXISTS idx_efiling_workflow_stages_role ON efiling_workflow_stages(role_id);
