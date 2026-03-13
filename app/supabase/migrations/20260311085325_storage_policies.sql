-- Allow anonymous users to upload to weekly-images bucket
CREATE POLICY "Allow anon uploads" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'weekly-images');

-- Allow anonymous users to update (upsert) files in weekly-images
CREATE POLICY "Allow anon updates" ON storage.objects
  FOR UPDATE TO anon
  USING (bucket_id = 'weekly-images')
  WITH CHECK (bucket_id = 'weekly-images');

-- Allow anonymous users to read files from weekly-images
CREATE POLICY "Allow anon reads" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'weekly-images');

-- Allow anonymous users to delete files from weekly-images
CREATE POLICY "Allow anon deletes" ON storage.objects
  FOR DELETE TO anon
  USING (bucket_id = 'weekly-images');
