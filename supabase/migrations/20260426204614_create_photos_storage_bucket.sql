/*
  # Bucket storage pour photos de chantier

  1. Création du bucket public `photos-chantier`
  2. Policies storage : upload/delete pour les utilisateurs authentifiés (leur dossier uniquement), lecture publique
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos-chantier',
  'photos-chantier',
  true,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'photos-chantier' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated users can delete own photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'photos-chantier' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public can view photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'photos-chantier');
