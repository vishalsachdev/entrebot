-- VentureBot Database Schema (Supabase/PostgreSQL)
-- Version: 1.0
-- Date: January 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    university TEXT,
    student_email TEXT, -- .edu email for verification
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (additional metadata)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    interests TEXT,
    activities TEXT,
    background TEXT,
    skills JSONB DEFAULT '[]'::jsonb, -- Array of learned skills
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================================================
-- CONVERSATIONS & SESSIONS
-- ============================================================================

-- Sessions (conversation threads)
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID, -- Links to projects table (nullable for pre-project sessions)
    title TEXT,
    channel TEXT DEFAULT 'web' CHECK (channel IN ('web', 'whatsapp', 'discord', 'telegram')),
    journey_stage TEXT DEFAULT 'onboarding' CHECK (
        journey_stage IN (
            'onboarding',
            'ideation',
            'validation',
            'product_planning',
            'prompt_engineering',
            'building',
            'launched',
            'growth'
        )
    ),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages within sessions
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    agent_name TEXT, -- Which agent generated this (if assistant role)
    metadata JSONB DEFAULT '{}'::jsonb, -- Additional message metadata
    token_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast message retrieval
CREATE INDEX idx_messages_session_id ON public.messages(session_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- ============================================================================
-- MEMORY SYSTEM
-- ============================================================================

-- Agent memory (key-value store scoped to user + session)
CREATE TABLE public.memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    expires_at TIMESTAMPTZ, -- Optional TTL
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, session_id, key)
);

-- Index for fast memory lookups
CREATE INDEX idx_memory_user_session ON public.memory(user_id, session_id);
CREATE INDEX idx_memory_key ON public.memory(key);

-- ============================================================================
-- PROJECTS & IDEAS
-- ============================================================================

-- Projects (user can have multiple startup ideas)
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'ideation' CHECK (
        status IN (
            'ideation',
            'validation',
            'planning',
            'building',
            'launched',
            'active',
            'paused',
            'abandoned'
        )
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link sessions to projects
ALTER TABLE public.sessions ADD FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- Pain points (stored discoveries)
CREATE TABLE public.pain_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    category TEXT CHECK (category IN ('functional', 'social', 'emotional', 'financial')),

    -- Deep pain point analysis
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'rare')),
    severity INTEGER CHECK (severity >= 1 AND severity <= 10),
    who_experiences TEXT,
    current_workarounds TEXT,
    willingness_to_pay TEXT CHECK (willingness_to_pay IN ('yes', 'no', 'unknown')),
    personal_experience BOOLEAN,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ideas (generated or user-provided)
CREATE TABLE public.ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    pain_point_id UUID REFERENCES public.pain_points(id) ON DELETE SET NULL,

    idea_text TEXT NOT NULL,
    concept TEXT, -- BADM 350 concept (e.g., "Network Effects", "SaaS")
    source TEXT DEFAULT 'ai_generated' CHECK (source IN ('ai_generated', 'user_provided')),
    selected BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Validations (market research results)
CREATE TABLE public.validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,

    -- Scores (0-1 scale)
    market_opportunity_score DECIMAL(3,2) CHECK (market_opportunity_score >= 0 AND market_opportunity_score <= 1),
    competitive_landscape_score DECIMAL(3,2) CHECK (competitive_landscape_score >= 0 AND competitive_landscape_score <= 1),
    execution_feasibility_score DECIMAL(3,2) CHECK (execution_feasibility_score >= 0 AND execution_feasibility_score <= 1),
    innovation_potential_score DECIMAL(3,2) CHECK (innovation_potential_score >= 0 AND innovation_potential_score <= 1),
    overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 1),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

    -- Market intelligence
    competitors JSONB DEFAULT '[]'::jsonb, -- Array of competitor objects
    market_gaps JSONB DEFAULT '[]'::jsonb, -- Array of identified gaps
    trends JSONB DEFAULT '[]'::jsonb, -- Array of market trends
    barriers JSONB DEFAULT '[]'::jsonb, -- Array of entry barriers
    recommendations JSONB DEFAULT '[]'::jsonb, -- Array of strategic recommendations

    -- Metadata
    notes TEXT,
    search_results JSONB, -- Raw search data for debugging

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products (PRDs and builder prompts)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
    validation_id UUID REFERENCES public.validations(id) ON DELETE SET NULL,

    -- PRD content
    overview TEXT,
    user_stories JSONB DEFAULT '[]'::jsonb,
    functional_requirements JSONB DEFAULT '[]'::jsonb,
    nonfunctional_requirements JSONB DEFAULT '[]'::jsonb,
    success_metrics JSONB DEFAULT '[]'::jsonb,

    -- Builder prompt
    builder_prompt TEXT,
    builder_tool TEXT, -- e.g., "bolt.new", "lovable", "v0"

    -- Launch information
    launched BOOLEAN DEFAULT FALSE,
    launch_date TIMESTAMPTZ,
    product_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(project_id) -- One product per project
);

-- ============================================================================
-- SHARING & COMMUNITY
-- ============================================================================

-- Shared conversations (public links)
CREATE TABLE public.shared_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

    share_id TEXT UNIQUE NOT NULL, -- Short shareable ID (e.g., "abc123")
    title TEXT,
    description TEXT, -- User-added context

    -- Content
    messages JSONB NOT NULL, -- Snapshot of messages at share time

    -- Privacy
    public BOOLEAN DEFAULT TRUE,
    allow_forking BOOLEAN DEFAULT TRUE,

    -- Analytics
    view_count INTEGER DEFAULT 0,
    fork_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ -- If user revokes share
);

CREATE INDEX idx_shared_conversations_share_id ON public.shared_conversations(share_id);
CREATE INDEX idx_shared_conversations_public ON public.shared_conversations(public) WHERE public = TRUE;

-- IllinoisHunt.org listings
CREATE TABLE public.hunt_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,

    -- Listing details
    name TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    product_url TEXT NOT NULL,
    venturebot_journey_url TEXT, -- Link to shared conversation

    -- Founder info
    founder_name TEXT,
    founder_email TEXT,
    university TEXT,

    -- Metadata
    tags JSONB DEFAULT '[]'::jsonb,
    metrics JSONB DEFAULT '{}'::jsonb, -- { users, revenue, milestones }

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'stealth')),
    featured BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- LEARNING & PROGRESS
-- ============================================================================

-- Milestones (journey tracking)
CREATE TABLE public.milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,

    milestone_type TEXT NOT NULL CHECK (
        milestone_type IN (
            'pain_articulated',
            'idea_selected',
            'idea_validated',
            'prd_completed',
            'product_built',
            'launched',
            'first_user',
            'first_revenue',
            'traction'
        )
    ),

    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    achieved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_milestones_user_project ON public.milestones(user_id, project_id);

-- Skills learned
CREATE TABLE public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

    skill_name TEXT NOT NULL,
    skill_category TEXT CHECK (
        skill_category IN (
            'prompt_engineering',
            'market_validation',
            'product_management',
            'no_code_tools',
            'ai_tools',
            'marketing',
            'business_concepts'
        )
    ),

    proficiency TEXT DEFAULT 'beginner' CHECK (
        proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')
    ),

    evidence JSONB DEFAULT '[]'::jsonb, -- Array of evidence (projects, exercises)

    learned_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, skill_name)
);

-- Learning resources (recommended to users)
CREATE TABLE public.learning_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    resource_type TEXT CHECK (
        resource_type IN ('article', 'video', 'course', 'exercise', 'tool_guide')
    ),

    skill_category TEXT,
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),

    estimated_time_minutes INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User resource progress
CREATE TABLE public.resource_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES public.learning_resources(id) ON DELETE CASCADE,

    status TEXT DEFAULT 'not_started' CHECK (
        status IN ('not_started', 'in_progress', 'completed')
    ),

    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    UNIQUE(user_id, resource_id)
);

-- ============================================================================
-- ANALYTICS & METRICS
-- ============================================================================

-- User activity tracking
CREATE TABLE public.user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

    activity_type TEXT NOT NULL CHECK (
        activity_type IN (
            'login',
            'message_sent',
            'agent_interaction',
            'validation_run',
            'prd_generated',
            'product_launched',
            'conversation_shared'
        )
    ),

    metadata JSONB DEFAULT '{}'::jsonb,
    channel TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_type ON public.user_activity(activity_type);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);

-- Agent performance metrics
CREATE TABLE public.agent_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,

    agent_name TEXT NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    latency_ms INTEGER,

    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_metrics_agent_name ON public.agent_metrics(agent_name);
CREATE INDEX idx_agent_metrics_created_at ON public.agent_metrics(created_at DESC);

-- ============================================================================
-- CHANNEL-SPECIFIC TABLES
-- ============================================================================

-- WhatsApp user mapping (phone to user_id)
CREATE TABLE public.whatsapp_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    phone_number TEXT UNIQUE NOT NULL,
    display_name TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Discord user mapping
CREATE TABLE public.discord_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    discord_id TEXT UNIQUE NOT NULL,
    discord_username TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Telegram user mapping
CREATE TABLE public.telegram_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    telegram_id TEXT UNIQUE NOT NULL,
    telegram_username TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pain_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hunt_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own data"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- User profiles
CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Sessions
CREATE POLICY "Users can view own sessions"
    ON public.sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
    ON public.sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
    ON public.sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
    ON public.sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Messages
CREATE POLICY "Users can view messages in own sessions"
    ON public.messages FOR SELECT
    USING (
        auth.uid() = user_id OR
        session_id IN (SELECT id FROM public.sessions WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert messages in own sessions"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR
        session_id IN (SELECT id FROM public.sessions WHERE user_id = auth.uid())
    );

-- Memory
CREATE POLICY "Users can view own memory"
    ON public.memory FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory"
    ON public.memory FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memory"
    ON public.memory FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memory"
    ON public.memory FOR DELETE
    USING (auth.uid() = user_id);

-- Projects
CREATE POLICY "Users can view own projects"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
    ON public.projects FOR DELETE
    USING (auth.uid() = user_id);

-- Shared conversations are public
CREATE POLICY "Anyone can view public shared conversations"
    ON public.shared_conversations FOR SELECT
    USING (public = TRUE AND revoked_at IS NULL);

CREATE POLICY "Users can create own shared conversations"
    ON public.shared_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shared conversations"
    ON public.shared_conversations FOR UPDATE
    USING (auth.uid() = user_id);

-- Hunt listings are public
CREATE POLICY "Anyone can view active hunt listings"
    ON public.hunt_listings FOR SELECT
    USING (status = 'active');

CREATE POLICY "Users can create own hunt listings"
    ON public.hunt_listings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hunt listings"
    ON public.hunt_listings FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memory_updated_at BEFORE UPDATE ON public.memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pain_points_updated_at BEFORE UPDATE ON public.pain_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON public.ideas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hunt_listings_updated_at BEFORE UPDATE ON public.hunt_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON public.skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment view count for shared conversations
CREATE OR REPLACE FUNCTION increment_share_view_count(share_id_param TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.shared_conversations
    SET view_count = view_count + 1
    WHERE share_id = share_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User lookups
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_student_email ON public.users(student_email);

-- Session queries
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_project_id ON public.sessions(project_id);
CREATE INDEX idx_sessions_active ON public.sessions(active) WHERE active = TRUE;
CREATE INDEX idx_sessions_journey_stage ON public.sessions(journey_stage);

-- Project queries
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);

-- Idea queries
CREATE INDEX idx_ideas_user_id ON public.ideas(user_id);
CREATE INDEX idx_ideas_project_id ON public.ideas(project_id);
CREATE INDEX idx_ideas_selected ON public.ideas(selected) WHERE selected = TRUE;

-- Validation queries
CREATE INDEX idx_validations_idea_id ON public.validations(idea_id);
CREATE INDEX idx_validations_overall_score ON public.validations(overall_score);

-- Product queries
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_project_id ON public.products(project_id);
CREATE INDEX idx_products_launched ON public.products(launched) WHERE launched = TRUE;

-- Hunt listings
CREATE INDEX idx_hunt_listings_status ON public.hunt_listings(status);
CREATE INDEX idx_hunt_listings_featured ON public.hunt_listings(featured) WHERE featured = TRUE;

-- ============================================================================
-- SAMPLE DATA (Development Only)
-- ============================================================================

-- Insert sample learning resources
INSERT INTO public.learning_resources (title, description, url, resource_type, skill_category, difficulty, estimated_time_minutes)
VALUES
    ('Prompt Engineering Guide', 'Learn to write effective prompts for AI tools', 'https://example.com/prompt-guide', 'article', 'prompt_engineering', 'beginner', 15),
    ('Market Validation 101', 'How to validate startup ideas quickly', 'https://example.com/validation', 'article', 'market_validation', 'beginner', 20),
    ('The Mom Test', 'How to talk to customers without biased feedback', 'https://example.com/mom-test', 'article', 'market_validation', 'intermediate', 30),
    ('Cursor AI Tutorial', 'Getting started with Cursor for AI-assisted coding', 'https://example.com/cursor', 'video', 'ai_tools', 'beginner', 25),
    ('Product Thinking', 'How to think like a product manager', 'https://example.com/product-thinking', 'course', 'product_management', 'intermediate', 120);

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- User journey progress view
CREATE OR REPLACE VIEW user_journey_progress AS
SELECT
    u.id AS user_id,
    u.email,
    COUNT(DISTINCT p.id) AS total_projects,
    COUNT(DISTINCT CASE WHEN pp.id IS NOT NULL THEN p.id END) AS projects_with_pain,
    COUNT(DISTINCT CASE WHEN i.selected = TRUE THEN p.id END) AS projects_with_idea,
    COUNT(DISTINCT CASE WHEN v.id IS NOT NULL THEN p.id END) AS projects_validated,
    COUNT(DISTINCT CASE WHEN pr.id IS NOT NULL THEN p.id END) AS projects_with_prd,
    COUNT(DISTINCT CASE WHEN pr.launched = TRUE THEN p.id END) AS projects_launched,
    MAX(s.created_at) AS last_active_at
FROM public.users u
LEFT JOIN public.projects p ON u.id = p.user_id
LEFT JOIN public.pain_points pp ON p.id = pp.project_id
LEFT JOIN public.ideas i ON p.id = i.project_id
LEFT JOIN public.validations v ON i.id = v.idea_id
LEFT JOIN public.products pr ON p.id = pr.project_id
LEFT JOIN public.sessions s ON u.id = s.user_id
GROUP BY u.id, u.email;

-- Agent usage statistics
CREATE OR REPLACE VIEW agent_usage_stats AS
SELECT
    agent_name,
    COUNT(*) AS total_calls,
    AVG(latency_ms) AS avg_latency_ms,
    AVG(input_tokens) AS avg_input_tokens,
    AVG(output_tokens) AS avg_output_tokens,
    SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END)::FLOAT / COUNT(*) AS success_rate,
    DATE_TRUNC('day', created_at) AS date
FROM public.agent_metrics
GROUP BY agent_name, DATE_TRUNC('day', created_at);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.users IS 'Core user accounts extending Supabase auth.users';
COMMENT ON TABLE public.sessions IS 'Conversation sessions - can span multiple projects';
COMMENT ON TABLE public.messages IS 'Individual messages within sessions';
COMMENT ON TABLE public.memory IS 'Agent memory key-value store scoped to user + session';
COMMENT ON TABLE public.projects IS 'User startup projects - one user can have multiple';
COMMENT ON TABLE public.pain_points IS 'Discovered pain points linked to projects';
COMMENT ON TABLE public.ideas IS 'Generated or user-provided ideas for solving pain points';
COMMENT ON TABLE public.validations IS 'Market validation results with multi-dimensional scoring';
COMMENT ON TABLE public.products IS 'PRDs and builder prompts - one per project';
COMMENT ON TABLE public.shared_conversations IS 'Public shareable conversation snapshots';
COMMENT ON TABLE public.hunt_listings IS 'IllinoisHunt.org product listings';
COMMENT ON TABLE public.milestones IS 'User journey milestone tracking';
COMMENT ON TABLE public.skills IS 'User-learned skills and proficiency levels';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
