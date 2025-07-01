import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid or expired token');
    }

    // Get user's plan to determine access level
    const { data: userPlan, error: planError } = await supabase
      .from('user_plans')
      .select('plan_type')
      .eq('user_id', user.id)
      .single();

    if (planError) {
      console.error('Error fetching user plan:', planError);
    }

    const filters = await req.json();
    console.log('Template search filters:', filters);

    // Build the query
    let query = supabase
      .from('content_templates')
      .select(`
        *,
        profiles!content_templates_created_by_fkey(full_name, email)
      `)
      .eq('is_public', true);

    // Apply plan-based access control
    if (userPlan?.plan_type) {
      const planHierarchy = { starter: 1, pro: 2, growth: 3, elite: 4 };
      const userPlanLevel = planHierarchy[userPlan.plan_type as keyof typeof planHierarchy] || 1;
      
      query = query.or(`min_plan_type.eq.starter,min_plan_type.eq.pro${userPlanLevel >= 2 ? ',min_plan_type.eq.growth' : ''}${userPlanLevel >= 3 ? ',min_plan_type.eq.elite' : ''}${userPlanLevel >= 4 ? '' : ''}`);
    } else {
      // Default to starter level access
      query = query.eq('min_plan_type', 'starter');
    }

    // Apply filters
    if (filters.query) {
      // Simple text search in name, description, and tags
      query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%,tags.cs.{${filters.query}}`);
    }

    if (filters.type && filters.type.length > 0) {
      query = query.in('type', filters.type);
    }

    if (filters.output_format && filters.output_format.length > 0) {
      query = query.in('output_format', filters.output_format);
    }

    if (filters.complexity_level && filters.complexity_level.length > 0) {
      query = query.in('complexity_level', filters.complexity_level);
    }

    if (filters.category && filters.category.length > 0) {
      query = query.in('category', filters.category);
    }

    if (filters.rating_min) {
      query = query.gte('rating', filters.rating_min);
    }

    if (filters.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured);
    }

    if (filters.tags && filters.tags.length > 0) {
      // Check if template tags overlap with filter tags
      query = query.overlaps('tags', filters.tags);
    }

    // Apply sorting
    const sortBy = filters.sort_by || 'rating';
    const sortOrder = filters.sort_order || 'desc';
    
    if (sortBy === 'rating') {
      query = sortOrder === 'desc' 
        ? query.order('rating', { ascending: false }).order('download_count', { ascending: false })
        : query.order('rating', { ascending: true }).order('download_count', { ascending: true });
    } else {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100); // Cap at 100
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('content_templates')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true);

    if (countError) {
      console.error('Error getting count:', countError);
    }

    // Execute the main query
    const { data: templates, error: templatesError } = await query
      .range(offset, offset + limit - 1);

    if (templatesError) {
      throw new Error(`Search failed: ${templatesError.message}`);
    }

    // Get template reviews for returned templates
    const templateIds = templates.map(t => t.id);
    const { data: reviews, error: reviewsError } = await supabase
      .from('template_reviews')
      .select(`
        template_id,
        rating,
        review_text,
        created_at,
        profiles!template_reviews_user_id_fkey(full_name)
      `)
      .in('template_id', templateIds)
      .order('created_at', { ascending: false })
      .limit(3); // Get up to 3 recent reviews per template

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    }

    // Group reviews by template_id
    const reviewsByTemplate = (reviews || []).reduce((acc, review) => {
      if (!acc[review.template_id]) {
        acc[review.template_id] = [];
      }
      acc[review.template_id].push(review);
      return acc;
    }, {} as Record<string, any[]>);

    // Enhance templates with reviews and computed fields
    const enhancedTemplates = templates.map(template => ({
      ...template,
      recent_reviews: reviewsByTemplate[template.id] || [],
      creator_name: template.profiles?.full_name || 'Anonymous',
      popularity_score: calculatePopularityScore(template),
      is_trending: isTemplateTreendig(template)
    }));

    // Log search analytics
    await supabase
      .from('user_activity_log')
      .insert({
        user_id: user.id,
        action: 'template_search',
        resource_type: 'template_search',
        metadata: {
          filters,
          results_count: templates.length,
          total_available: totalCount || 0,
          user_plan: userPlan?.plan_type || 'unknown'
        }
      });

    const result = {
      templates: enhancedTemplates,
      total_count: totalCount || 0,
      page,
      limit,
      has_more: (totalCount || 0) > offset + limit,
      filters_applied: filters,
      user_access_level: userPlan?.plan_type || 'starter'
    };

    console.log(`Template search completed: ${templates.length} results for user ${user.id}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-templates:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Search failed',
        details: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function calculatePopularityScore(template: any): number {
  const weights = {
    download_count: 0.4,
    rating: 0.3,
    review_count: 0.2,
    recency: 0.1
  };

  const downloadScore = Math.min(template.download_count / 100, 1); // Normalize to 0-1
  const ratingScore = (template.rating || 0) / 5; // Normalize to 0-1
  const reviewScore = Math.min((template.review_count || 0) / 20, 1); // Normalize to 0-1
  
  // Recency score (newer templates get higher score)
  const daysSinceCreation = (Date.now() - new Date(template.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 1 - (daysSinceCreation / 365)); // Decay over a year

  return (
    downloadScore * weights.download_count +
    ratingScore * weights.rating +
    reviewScore * weights.review_count +
    recencyScore * weights.recency
  );
}

function isTemplateTreendig(template: any): boolean {
  // Consider trending if high activity in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const isRecent = new Date(template.updated_at) > thirtyDaysAgo;
  const hasGoodRating = (template.rating || 0) >= 4.0;
  const hasDownloads = (template.download_count || 0) > 5;
  
  return isRecent && hasGoodRating && hasDownloads;
}