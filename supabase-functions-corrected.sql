-- ✅ CORRECTED Supabase Functions for GovContractAI Platform
-- This matches your actual database schema
-- Run this entire file in your Supabase SQL Editor

-- 1. Cache Analytics Function (Updated for your schema)
CREATE OR REPLACE FUNCTION get_cache_analytics(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_requests', COUNT(*),
    'unique_users', COUNT(DISTINCT user_id),
    'avg_response_time', AVG(processing_time_ms),
    'success_rate', (COUNT(*) FILTER (WHERE success = true))::FLOAT / COUNT(*) * 100,
    'by_endpoint', json_agg(
      json_build_object(
        'endpoint', function_name,
        'requests', COUNT(*),
        'avg_time', AVG(processing_time_ms)
      )
    )
  ) INTO result
  FROM ai_usage_logs
  WHERE created_at >= NOW() - INTERVAL '1 day' * days_back;
  
  RETURN COALESCE(result, '{"total_requests": 0}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. User Activity Summary (Updated for your schema)
CREATE OR REPLACE FUNCTION get_user_activity_summary(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_applications', COUNT(DISTINCT a.id),
    'total_opportunities_viewed', COUNT(DISTINCT o.id),
    'ai_queries_this_month', COUNT(DISTINCT l.id),
    'last_login', MAX(p.updated_at),
    'subscription_status', s.status,
    'company_name', c.name
  ) INTO result
  FROM profiles p
  LEFT JOIN applications a ON a.created_by = p.id
  LEFT JOIN opportunities o ON o.created_at >= p.created_at  
  LEFT JOIN ai_usage_logs l ON l.user_id = p.id AND l.created_at >= DATE_TRUNC('month', NOW())
  LEFT JOIN subscriptions s ON s.company_id = p.company_id
  LEFT JOIN companies c ON c.id = p.company_id
  WHERE p.id = user_uuid
  GROUP BY p.id, s.status, c.name;
  
  RETURN COALESCE(result, '{"total_applications": 0}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Opportunity Matching Function (Updated for your schema)
CREATE OR REPLACE FUNCTION match_opportunities_for_user(user_uuid UUID, limit_count INTEGER DEFAULT 20)
RETURNS TABLE(
  opportunity_id UUID,
  title TEXT,
  agency TEXT,
  match_score INTEGER,
  estimated_value TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  match_reasons TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.title,
    o.agency,
    -- Simple scoring algorithm based on user's past applications
    CASE 
      WHEN o.naics_codes && (
        SELECT array_agg(DISTINCT unnest(app_naics.naics_codes)) 
        FROM applications a
        JOIN opportunities app_opps ON app_opps.id = a.opportunity_id
        CROSS JOIN LATERAL unnest(app_opps.naics_codes) AS app_naics(naics_codes)
        WHERE a.created_by = user_uuid
      ) THEN 85
      WHEN o.agency IN (
        SELECT DISTINCT app_opps.agency 
        FROM applications a 
        JOIN opportunities app_opps ON app_opps.id = a.opportunity_id
        WHERE a.created_by = user_uuid 
        LIMIT 5
      ) THEN 70
      ELSE 50
    END as match_score,
    o.estimated_value,
    o.due_date,
    ARRAY['Past experience in similar contracts', 'Agency familiarity'] as match_reasons
  FROM opportunities o
  WHERE o.is_active = true
    AND (o.due_date IS NULL OR o.due_date > NOW())
  ORDER BY match_score DESC, o.estimated_value_max DESC NULLS LAST
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Application Analytics (Updated for your schema)
CREATE OR REPLACE FUNCTION get_application_analytics(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_applications', COUNT(*),
    'pending_applications', COUNT(*) FILTER (WHERE status IN ('draft', 'in_progress')),
    'submitted_applications', COUNT(*) FILTER (WHERE status = 'submitted'),
    'under_review_applications', COUNT(*) FILTER (WHERE status = 'under_review'),
    'awarded_applications', COUNT(*) FILTER (WHERE status = 'awarded'),
    'rejected_applications', COUNT(*) FILTER (WHERE status = 'rejected'),
    'win_rate', CASE 
      WHEN COUNT(*) FILTER (WHERE status IN ('submitted', 'under_review', 'awarded', 'rejected')) > 0 THEN 
        (COUNT(*) FILTER (WHERE status = 'awarded'))::FLOAT / COUNT(*) FILTER (WHERE status IN ('submitted', 'under_review', 'awarded', 'rejected')) * 100
      ELSE 0 
    END,
    'avg_quality_score', ROUND(AVG(quality_score), 2),
    'total_time_spent', SUM(time_spent),
    'last_application_date', MAX(created_at)
  ) INTO result
  FROM applications
  WHERE created_by = user_uuid;
  
  RETURN COALESCE(result, '{"total_applications": 0}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Company Performance Metrics (Updated for your schema)
CREATE OR REPLACE FUNCTION get_company_performance(company_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'company_name', c.name,
    'total_team_members', COUNT(DISTINCT p.id),
    'total_applications', COUNT(DISTINCT a.id),
    'team_win_rate', CASE 
      WHEN COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('submitted', 'under_review', 'awarded', 'rejected')) > 0 THEN 
        (COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'awarded'))::FLOAT / COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('submitted', 'under_review', 'awarded', 'rejected')) * 100
      ELSE 0 
    END,
    'active_opportunities_count', COUNT(DISTINCT o.id) FILTER (WHERE o.is_active = true),
    'monthly_ai_usage', COUNT(DISTINCT l.id) FILTER (WHERE l.created_at >= DATE_TRUNC('month', NOW())),
    'avg_application_quality', ROUND(AVG(a.quality_score), 2),
    'subscription_tier', s.tier,
    'subscription_status', s.status
  ) INTO result
  FROM companies c
  LEFT JOIN profiles p ON p.company_id = c.id
  LEFT JOIN applications a ON a.created_by = p.id
  LEFT JOIN opportunities o ON o.is_active = true
  LEFT JOIN ai_usage_logs l ON l.user_id = p.id
  LEFT JOIN subscriptions s ON s.company_id = c.id
  WHERE c.id = company_uuid
  GROUP BY c.id, c.name, s.tier, s.status;
  
  RETURN COALESCE(result, '{"company_name": "Unknown"}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Insert Sample Opportunities (Updated for your actual schema)
INSERT INTO opportunities (
  id, 
  title, 
  agency, 
  description, 
  type,
  is_active, 
  due_date, 
  estimated_value,
  estimated_value_max, 
  naics_codes, 
  created_at
)
VALUES 
  (
    gen_random_uuid(), 
    'Healthcare IT Modernization', 
    'Department of Veterans Affairs', 
    'Modernize legacy healthcare IT systems across VA medical centers', 
    'rfp',
    true, 
    '2025-08-15'::timestamp with time zone, 
    '$2.5M',
    2500000, 
    ARRAY['541511', '541512'], 
    NOW()
  ),
  (
    gen_random_uuid(), 
    'Educational Technology Platform', 
    'Department of Education', 
    'Develop comprehensive online learning platform for K-12 students', 
    'rfp',
    true, 
    '2025-09-01'::timestamp with time zone, 
    '$1.8M',
    1800000, 
    ARRAY['541511', '611110'], 
    NOW()
  ),
  (
    gen_random_uuid(), 
    'Cybersecurity Assessment Services', 
    'Department of Homeland Security', 
    'Comprehensive cybersecurity assessment and vulnerability testing', 
    'rfp',
    true, 
    '2025-07-30'::timestamp with time zone, 
    '$3.2M',
    3200000, 
    ARRAY['541511', '541512'], 
    NOW()
  ),
  (
    gen_random_uuid(), 
    'Construction Management Services', 
    'General Services Administration', 
    'Project management for federal building renovation and modernization', 
    'rfp',
    true, 
    '2025-08-20'::timestamp with time zone, 
    '$4.5M',
    4500000, 
    ARRAY['236220', '541330'], 
    NOW()
  ),
  (
    gen_random_uuid(), 
    'Manufacturing Process Optimization', 
    'Department of Defense', 
    'Optimize manufacturing processes for defense equipment production', 
    'rfp',
    true, 
    '2025-09-15'::timestamp with time zone, 
    '$6.7M',
    6700000, 
    ARRAY['336411', '541614'], 
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_cache_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity_summary TO authenticated;
GRANT EXECUTE ON FUNCTION match_opportunities_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION get_application_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_performance TO authenticated;

-- Create additional indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_opportunities_is_active_due_date ON opportunities(is_active, due_date);
CREATE INDEX IF NOT EXISTS idx_applications_created_by_status ON applications(created_by, status);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_created ON ai_usage_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_opportunities_naics_codes_gin ON opportunities USING GIN(naics_codes);

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✅ All Supabase functions created successfully!';
    RAISE NOTICE '📊 Database functions now match your actual schema';
    RAISE NOTICE '🚀 Ready to test the platform functionality';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Functions created:';
    RAISE NOTICE '   - get_cache_analytics()';
    RAISE NOTICE '   - get_user_activity_summary()';
    RAISE NOTICE '   - match_opportunities_for_user()';
    RAISE NOTICE '   - get_application_analytics()';
    RAISE NOTICE '   - get_company_performance()';
    RAISE NOTICE '';
    RAISE NOTICE '💾 Sample opportunities inserted for testing';
    RAISE NOTICE '🎯 Platform is now ready for full functionality!';
END $$;