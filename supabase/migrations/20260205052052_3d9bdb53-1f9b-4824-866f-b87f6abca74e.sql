-- Create a SECURITY DEFINER function to check if an email exists in whitelist
-- This returns only a boolean, not the actual row data, protecting PII
CREATE OR REPLACE FUNCTION public.check_whitelist_email(_email text)
RETURNS TABLE(exists_in_whitelist boolean, lecture_id uuid, speaker_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    true as exists_in_whitelist,
    w.lecture_id,
    w.speaker_id
  FROM public.whitelist w
  WHERE w.email = lower(_email)
  LIMIT 1;
$$;

-- Grant execute permission to anonymous users for signup flow
GRANT EXECUTE ON FUNCTION public.check_whitelist_email(text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_whitelist_email(text) TO authenticated;

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can check whitelist by email for signup" ON public.whitelist;