-- Safe Content Templates Migration - Recovery Script
-- This migration safely creates content templates system while handling existing objects

-- 1. Ensure content_type enum exists with all required values
DO $$
BEGIN
    -- Check if content_type enum exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_type') THEN
        CREATE TYPE content_type AS ENUM (
            'email_sequence',
            'ad_copy', 
            'landing_page',
            'social_post',
            'blog_post',
            'funnel',
            'strategy_brief'
        );
    ELSE
        -- Enum exists, ensure all values are present
        ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'email_sequence';
        ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'ad_copy';
        ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'landing_page';
        ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'social_post';
        ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'blog_post';
        ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'funnel';
        ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'strategy_brief';
    END IF;
END $$;

-- 2. Create content_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.content_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    type content_type NOT NULL,
    template_data JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_by UUID NOT NULL,
    usage_count INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Enable RLS if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' AND c.relname = 'content_templates' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 4. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_content_templates_created_by ON public.content_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_content_templates_type ON public.content_templates(type);
CREATE INDEX IF NOT EXISTS idx_content_templates_public ON public.content_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_content_templates_tags ON public.content_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_content_templates_usage ON public.content_templates(usage_count DESC);

-- 5. Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_content_templates_created_by'
        AND table_name = 'content_templates'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.content_templates 
        ADD CONSTRAINT fk_content_templates_created_by 
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Create or replace the update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_content_templates_updated_at'
        AND event_object_table = 'content_templates'
    ) THEN
        CREATE TRIGGER update_content_templates_updated_at
        BEFORE UPDATE ON public.content_templates
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- 8. Create RLS policies (drop and recreate to ensure they're correct)
DROP POLICY IF EXISTS "Users can view accessible templates" ON public.content_templates;
DROP POLICY IF EXISTS "Users can create own templates" ON public.content_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.content_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON public.content_templates;

-- Create updated RLS policies
CREATE POLICY "Users can view accessible templates" 
ON public.content_templates
FOR SELECT 
USING (
    created_by = auth.uid() OR 
    (is_public = true AND can_access_template(min_plan_type, auth.uid()))
);

CREATE POLICY "Users can create own templates" 
ON public.content_templates
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates" 
ON public.content_templates
FOR UPDATE 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own templates" 
ON public.content_templates
FOR DELETE 
USING (created_by = auth.uid());

-- 9. Add missing columns if they don't exist
DO $$
BEGIN
    -- Add min_plan_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'content_templates' 
        AND column_name = 'min_plan_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.content_templates 
        ADD COLUMN min_plan_type plan_type NOT NULL DEFAULT 'starter';
    END IF;
    
    -- Add other missing columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'content_templates' 
        AND column_name = 'category'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.content_templates 
        ADD COLUMN category TEXT DEFAULT 'general';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'content_templates' 
        AND column_name = 'is_featured'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.content_templates 
        ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'content_templates' 
        AND column_name = 'rating'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.content_templates 
        ADD COLUMN rating NUMERIC DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'content_templates' 
        AND column_name = 'review_count'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.content_templates 
        ADD COLUMN review_count INTEGER DEFAULT 0;
    END IF;
END $$;