-- ============================================================================
-- RUN THIS FIRST: Check Current Schema
-- ============================================================================
-- This helps determine what fields already exist and what needs to be added

-- Query 1: Check all columns in community_posts
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'community_posts'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Query 2: Check if QC fields already exist
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'community_posts' AND column_name = 'mode'
    ) THEN 'mode exists' 
    ELSE 'mode MISSING' 
  END as mode_status,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'community_posts' AND column_name = 'voice'
    ) THEN 'voice exists' 
    ELSE 'voice MISSING' 
  END as voice_status,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'community_posts' AND column_name = 'qc_status'
    ) THEN 'qc_status exists' 
    ELSE 'qc_status MISSING' 
  END as qc_status_field,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'community_posts' AND column_name = 'generation_model'
    ) THEN 'generation_model exists' 
    ELSE 'generation_model MISSING' 
  END as model_field;

-- Query 3: Check current save_post_and_deduct RPC signature
SELECT 
  routine_name,
  data_type as return_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'save_post_and_deduct'
  AND routine_schema = 'public';

-- ============================================================================
-- AFTER RUNNING QUERIES ABOVE, SHARE RESULTS WITH ME
-- ============================================================================
-- Then I can tell you exactly which migration steps to run
