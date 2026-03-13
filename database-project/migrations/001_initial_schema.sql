-- ─── WMP Initial Database Schema ────────────────────────────────────────────
-- Creates all core tables for the Works Management Portal.
-- Run this FIRST on a fresh PostgreSQL database.
-- ────────────────────────────────────────────────────────────────────────────

-- ─── Status Lookup ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS status (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Districts ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Towns ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS towns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    district_id INTEGER REFERENCES districts(id),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Sub Towns ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sub_towns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    town_id INTEGER REFERENCES towns(id),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Users ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    contact_number VARCHAR(50),
    cnic VARCHAR(15),
    role INTEGER DEFAULT 0,
    image TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Complaint Types ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaint_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Complaint Sub Types ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaint_sub_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    complaint_type_id INTEGER REFERENCES complaint_types(id),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Complaints ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    description TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    district_id INTEGER REFERENCES districts(id),
    town_id INTEGER REFERENCES towns(id),
    sub_town_id INTEGER REFERENCES sub_towns(id),
    complaint_type_id INTEGER REFERENCES complaint_types(id),
    status INTEGER REFERENCES status(id) DEFAULT 1,
    created_by INTEGER REFERENCES users(id),
    assigned_to INTEGER,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Agents ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    contact_number VARCHAR(50),
    company_name VARCHAR(255),
    district_id INTEGER REFERENCES districts(id),
    town_id INTEGER REFERENCES towns(id),
    user_id INTEGER REFERENCES users(id),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Social Media Agents ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_media_agents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    contact_number VARCHAR(50),
    role INTEGER,
    user_id INTEGER REFERENCES users(id),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Work Requests ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS work_request (
    id SERIAL PRIMARY KEY,
    description TEXT,
    district_id INTEGER REFERENCES districts(id),
    town_id INTEGER REFERENCES towns(id),
    sub_town_id INTEGER REFERENCES sub_towns(id),
    status INTEGER REFERENCES status(id) DEFAULT 1,
    created_by INTEGER REFERENCES users(id),
    assigned_to INTEGER,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Notifications ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── User Actions (Audit Log) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_actions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100),
    entity_type VARCHAR(100),
    entity_id INTEGER,
    entity_name VARCHAR(255),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- E-FILING SYSTEM TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── E-Filing Departments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS efiling_departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    parent_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing Roles ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS efiling_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing Users ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS efiling_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    full_name VARCHAR(255),
    role_id INTEGER REFERENCES efiling_roles(id),
    department_id INTEGER REFERENCES efiling_departments(id),
    district_id INTEGER,
    town_id INTEGER,
    subtown_id INTEGER,
    division_id INTEGER,
    image TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing File Status ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS efiling_file_status (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    color VARCHAR(20),
    is_active BOOLEAN DEFAULT true
);

-- ─── E-Filing File Types ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS efiling_file_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing Categories ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS efiling_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing Files ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS efiling_files (
    id SERIAL PRIMARY KEY,
    file_number VARCHAR(100),
    subject TEXT,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'normal',
    department_id INTEGER REFERENCES efiling_departments(id),
    file_type_id INTEGER REFERENCES efiling_file_types(id),
    category_id INTEGER REFERENCES efiling_categories(id),
    status_id INTEGER REFERENCES efiling_file_status(id),
    district_id INTEGER,
    town_id INTEGER,
    division_id INTEGER,
    zone_id INTEGER,
    created_by INTEGER,
    assigned_to INTEGER,
    work_request_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing Workflows ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS efiling_workflows (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES efiling_files(id),
    from_user_id INTEGER,
    to_user_id INTEGER,
    action VARCHAR(100),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing Teams ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS efiling_teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department_id INTEGER REFERENCES efiling_departments(id),
    leader_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing Signatures ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS efiling_signatures (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    file_id INTEGER REFERENCES efiling_files(id),
    signature_data TEXT,
    signature_color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing SLA Policies ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS efiling_sla_policies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    file_type_id INTEGER REFERENCES efiling_file_types(id),
    department_id INTEGER REFERENCES efiling_departments(id),
    priority VARCHAR(20),
    max_hours INTEGER,
    escalation_hours INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing Templates ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS efiling_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    content TEXT,
    department_id INTEGER REFERENCES efiling_departments(id),
    created_by INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing Meetings ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS efiling_meetings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    meeting_date TIMESTAMP,
    location VARCHAR(255),
    department_id INTEGER REFERENCES efiling_departments(id),
    created_by INTEGER,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── E-Filing Daak (Inward/Outward Registry) ─────────────────────────────
CREATE TABLE IF NOT EXISTS efiling_daak (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL, -- 'inward' or 'outward'
    reference_number VARCHAR(100),
    subject TEXT,
    from_entity VARCHAR(255),
    to_entity VARCHAR(255),
    department_id INTEGER REFERENCES efiling_departments(id),
    file_id INTEGER REFERENCES efiling_files(id),
    received_date TIMESTAMP,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Security Tables ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    ip_address VARCHAR(45),
    success BOOLEAN DEFAULT false,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_district ON complaints(district_id);
CREATE INDEX IF NOT EXISTS idx_work_request_status ON work_request(status);
CREATE INDEX IF NOT EXISTS idx_efiling_files_department ON efiling_files(department_id);
CREATE INDEX IF NOT EXISTS idx_efiling_files_status ON efiling_files(status_id);
CREATE INDEX IF NOT EXISTS idx_efiling_files_created_by ON efiling_files(created_by);
CREATE INDEX IF NOT EXISTS idx_efiling_users_email ON efiling_users(email);
CREATE INDEX IF NOT EXISTS idx_efiling_users_department ON efiling_users(department_id);
CREATE INDEX IF NOT EXISTS idx_efiling_workflows_file ON efiling_workflows(file_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_user ON user_actions(user_id);
