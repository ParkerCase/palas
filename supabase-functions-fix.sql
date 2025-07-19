-- Essential Supabase Functions for GovContractAI Platform
-- Run this entire file in your Supabase SQL Editor

-- 1. Cache Analytics Function
CREATE OR REPLACE FUNCTION get_cache_analytics(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_requests', COUNT(*),
    'unique_users', COUNT(DISTINCT user_id),
    'avg_response_time', AVG(response_time_ms),
    'success_rate', (COUNT(*) FILTER (WHERE status = 'success'))::FLOAT / COUNT(*) * 100,
    'by_endpoint', json_agg(
      json_build_object(
        'endpoint', endpoint,
        'requests', COUNT(*),
        'avg_time', AVG(response_time_ms)
      )
    )
  ) INTO result
  FROM ai_usage_logs
  WHERE created_at >= NOW() - INTERVAL '1 day' * days_back;
  
  RETURN COALESCE(result, '{"total_requests": 0}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. User Activity Summary
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
  LEFT JOIN applications a ON a.user_id = p.id
  LEFT JOIN opportunities o ON o.user_id = p.id  
  LEFT JOIN ai_usage_logs l ON l.user_id = p.id AND l.created_at >= DATE_TRUNC('month', NOW())
  LEFT JOIN subscriptions s ON s.user_id = p.id
  LEFT JOIN companies c ON c.id = p.company_id
  WHERE p.id = user_uuid
  GROUP BY p.id, s.status, c.name;
  
  RETURN COALESCE(result, '{"total_applications": 0}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Opportunity Matching Function
CREATE OR REPLACE FUNCTION match_opportunities_for_user(user_uuid UUID, limit_count INTEGER DEFAULT 20)
RETURNS TABLE(
  opportunity_id UUID,
  title TEXT,
  agency TEXT,
  match_score INTEGER,
  estimated_value BIGINT,
  closing_date DATE,
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
        SELECT array_agg(DISTINCT naics_code) 
        FROM applications a 
        WHERE a.user_id = user_uuid
      ) THEN 85
      WHEN o.agency IN (
        SELECT DISTINCT agency 
        FROM applications a 
        WHERE a.user_id = user_uuid 
        LIMIT 5
      ) THEN 70
      ELSE 50
    END as match_score,
    o.estimated_value,
    o.closing_date,
    ARRAY['Past experience in similar contracts', 'Agency familiarity'] as match_reasons
  FROM opportunities o
  WHERE o.status = 'open'
    AND o.closing_date > NOW()
  ORDER BY match_score DESC, o.estimated_value DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Application Analytics
CREATE OR REPLACE FUNCTION get_application_analytics(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_applications', COUNT(*),
    'pending_applications', COUNT(*) FILTER (WHERE status = 'pending'),
    'awarded_applications', COUNT(*) FILTER (WHERE status = 'awarded'),
    'rejected_applications', COUNT(*) FILTER (WHERE status = 'rejected'),
    'win_rate', CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE status = 'awarded'))::FLOAT / COUNT(*) * 100
      ELSE 0 
    END,
    'total_value_applied', SUM(estimated_value),
    'total_value_won', SUM(estimated_value) FILTER (WHERE status = 'awarded'),
    'avg_application_value', AVG(estimated_value),
    'last_application_date', MAX(created_at)
  ) INTO result
  FROM applications
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(result, '{"total_applications": 0}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Company Performance Metrics
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
      WHEN COUNT(DISTINCT a.id) > 0 THEN 
        (COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'awarded'))::FLOAT / COUNT(DISTINCT a.id) * 100
      ELSE 0 
    END,
    'total_contract_value', SUM(DISTINCT a.estimated_value) FILTER (WHERE a.status = 'awarded'),
    'active_opportunities', COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'open'),
    'monthly_ai_usage', COUNT(DISTINCT l.id) FILTER (WHERE l.created_at >= DATE_TRUNC('month', NOW()))
  ) INTO result
  FROM companies c
  LEFT JOIN profiles p ON p.company_id = c.id
  LEFT JOIN applications a ON a.user_id = p.id
  LEFT JOIN opportunities o ON o.user_id = p.id
  LEFT JOIN ai_usage_logs l ON l.user_id = p.id
  WHERE c.id = company_uuid
  GROUP BY c.id, c.name;
  
  RETURN COALESCE(result, '{"company_name": "Unknown"}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Insert Sample Opportunities (for testing)
INSERT INTO opportunities (id, title, agency, description, status, closing_date, estimated_value, naics_codes, created_at)
VALUES 
  (gen_random_uuid(), 'Healthcare IT Modernization', 'Department of Veterans Affairs', 'Modernize legacy healthcare IT systems', 'open', '2025-08-15', 2500000, ARRAY['541511', '541512'], NOW()),
  (gen_random_uuid(), 'Educational Technology Platform', 'Department of Education', 'Develop online learning platform for K-12', 'open', '2025-09-01', 1800000, ARRAY['541511', '611110'], NOW()),
  (gen_random_uuid(), 'Cybersecurity Assessment Services', 'Department of Homeland Security', 'Comprehensive cybersecurity assessment', 'open', '2025-07-30', 3200000, ARRAY['541511', '541512'], NOW()),
  (gen_random_uuid(), 'Construction Management Services', 'General Services Administration', 'Project management for federal building renovation', 'open', '2025-08-20', 4500000, ARRAY['236220', '541330'], NOW()),
  (gen_random_uuid(), 'Manufacturing Process Optimization', 'Department of Defense', 'Optimize manufacturing processes for defense equipment', 'open', '2025-09-15', 6700000, ARRAY['336411', '541614'], NOW())
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_cache_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity_summary TO authenticated;
GRANT EXECUTE ON FUNCTION match_opportunities_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION get_application_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_performance TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_status_closing ON opportunities(status, closing_date);
CREATE INDEX IF NOT EXISTS idx_applications_user_id_status ON applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_created ON ai_usage_logs(user_id, created_at);

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✅ All Supabase functions created successfully!';
    RAISE NOTICE '📊 Database functions are now ready for GovContractAI platform';
    RAISE NOTICE '🚀 You can now test the APIs and dashboard functionality';
END $$;