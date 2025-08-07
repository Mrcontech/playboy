/*
  # Performance Optimization Database Indexes

  1. Critical Indexes
    - Add indexes on frequently queried columns
    - Optimize JOIN performance
    - Speed up filtering and sorting operations
  
  2. Computed Columns
    - Add pre-calculated stats columns to avoid real-time computation
    - Update triggers to maintain data consistency
*/

-- Critical performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_bench ON profiles(user_id, bench);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_status_bench ON profiles(status, bench);

CREATE INDEX IF NOT EXISTS idx_meetings_profile_id_date ON meetings(profile_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_profile_id_performance ON meetings(profile_id, performance_rating);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date DESC);

CREATE INDEX IF NOT EXISTS idx_upcoming_dates_profile_id_date ON upcoming_dates(profile_id, date);
CREATE INDEX IF NOT EXISTS idx_upcoming_dates_date ON upcoming_dates(date);

-- Add pre-computed stats columns to profiles table for instant access
DO $$
BEGIN
  -- Add meeting_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'meeting_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN meeting_count integer DEFAULT 0;
  END IF;

  -- Add total_spent column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'total_spent'
  ) THEN
    ALTER TABLE profiles ADD COLUMN total_spent numeric DEFAULT 0;
  END IF;

  -- Add average_rating column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE profiles ADD COLUMN average_rating numeric DEFAULT 0;
  END IF;

  -- Add hookup_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'hookup_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN hookup_count integer DEFAULT 0;
  END IF;

  -- Add cpn column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'cpn'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cpn numeric DEFAULT 0;
  END IF;
END $$;

-- Function to update profile stats
CREATE OR REPLACE FUNCTION update_profile_stats(profile_id_param uuid)
RETURNS void AS $$
DECLARE
  meeting_count_val integer;
  total_spent_val numeric;
  hookup_count_val integer;
  avg_rating_val numeric;
  cpn_val numeric;
BEGIN
  -- Calculate stats from meetings
  SELECT 
    COUNT(*),
    COALESCE(SUM(amount_spent), 0),
    COUNT(*) FILTER (WHERE performance_rating > 0),
    COALESCE(AVG(rating), 0)
  INTO 
    meeting_count_val,
    total_spent_val,
    hookup_count_val,
    avg_rating_val
  FROM meetings 
  WHERE profile_id = profile_id_param;

  -- Calculate CPN
  cpn_val := CASE 
    WHEN hookup_count_val > 0 THEN total_spent_val / hookup_count_val 
    ELSE 0 
  END;

  -- Update profile with calculated stats
  UPDATE profiles 
  SET 
    meeting_count = meeting_count_val,
    total_spent = total_spent_val,
    hookup_count = hookup_count_val,
    average_rating = avg_rating_val,
    cpn = cpn_val,
    updated_at = now()
  WHERE id = profile_id_param;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update stats when meetings change
CREATE OR REPLACE FUNCTION trigger_update_profile_stats()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_profile_stats(OLD.profile_id);
    RETURN OLD;
  ELSE
    PERFORM update_profile_stats(NEW.profile_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic stats updates
DROP TRIGGER IF EXISTS update_profile_stats_trigger ON meetings;
CREATE TRIGGER update_profile_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_profile_stats();

-- Initialize stats for existing profiles
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN SELECT id FROM profiles LOOP
    PERFORM update_profile_stats(profile_record.id);
  END LOOP;
END $$;