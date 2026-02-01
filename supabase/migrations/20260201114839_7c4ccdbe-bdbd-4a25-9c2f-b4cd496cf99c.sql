-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can insert security logs" ON public.security_logs;

-- Create a more restrictive policy for authenticated users only
CREATE POLICY "Authenticated users can insert security logs"
ON public.security_logs FOR INSERT
WITH CHECK (auth.role() = 'authenticated');