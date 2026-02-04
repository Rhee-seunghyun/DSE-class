-- Allow anonymous users to check if email exists in whitelist (for signup verification)
CREATE POLICY "Anyone can check whitelist by email for signup"
ON public.whitelist
FOR SELECT
USING (true);