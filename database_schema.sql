-- VIFM Portal Database Schema
-- Tables for business development and consultant opportunities

-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'consultant', -- consultant, bd, admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create opportunities table for consultant training opportunities
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES profiles(id),
    course_title TEXT NOT NULL,
    client_company TEXT NOT NULL,
    client_contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    opportunity_source TEXT,
    consultant_name TEXT,
    status TEXT DEFAULT 'active', -- active, completed, cancelled
    notes TEXT,
    priority TEXT DEFAULT 'medium', -- low, medium, high
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create bd_opportunities table for business development pipeline
CREATE TABLE IF NOT EXISTS bd_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES profiles(id),
    source_opportunity_id UUID REFERENCES opportunities(id),
    course_title TEXT NOT NULL,
    client TEXT NOT NULL,
    city TEXT,
    consultant_name TEXT,
    primary_contact TEXT,
    contact_title TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    estimated_budget DECIMAL(12,2),
    pipeline_stage TEXT DEFAULT 'qualified', -- qualified, proposal, negotiation, closed-won, closed-lost
    probability INTEGER DEFAULT 25, -- 0-100
    expected_close_date DATE,
    competitors TEXT,
    bd_notes TEXT,
    next_actions TEXT,
    bd_prof TEXT, -- BD professional name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert demo users for testing
INSERT INTO profiles (email, full_name, role) VALUES 
    ('aiman@vifm.ae', 'Aiman', 'consultant'),
    ('amal.kayed@vifm.ae', 'Amal Kayed', 'bd'),
    ('admin@vifm.ae', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bd_opportunities_stage ON bd_opportunities(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_bd_opportunities_client ON bd_opportunities(client);
CREATE INDEX IF NOT EXISTS idx_opportunities_client ON opportunities(client_company);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to auto-update updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bd_opportunities_updated_at BEFORE UPDATE ON bd_opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();