-- Drop existing policies and recreate with master support
DROP POLICY IF EXISTS "Speakers can upload lecture files" ON storage.objects;
DROP POLICY IF EXISTS "Speakers can update their lecture files" ON storage.objects;
DROP POLICY IF EXISTS "Speakers can delete their lecture files" ON storage.objects;

-- Recreate policies allowing both speaker and master roles
CREATE POLICY "Speakers and masters can upload lecture files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lecture-files'
  AND (has_role(auth.uid(), 'speaker'::app_role) OR has_role(auth.uid(), 'master'::app_role))
);

CREATE POLICY "Speakers and masters can update lecture files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lecture-files'
  AND (has_role(auth.uid(), 'speaker'::app_role) OR has_role(auth.uid(), 'master'::app_role))
);

CREATE POLICY "Speakers and masters can delete lecture files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'lecture-files'
  AND (has_role(auth.uid(), 'speaker'::app_role) OR has_role(auth.uid(), 'master'::app_role))
);