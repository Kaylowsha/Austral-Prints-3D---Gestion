-- 1. Migration: Add evidence_url to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS evidence_url TEXT;

-- 2. SUPABASE STORAGE SETUP (Requerido para subir boletas)
-- Nota: Si el siguiente SQL falla por permisos, por favor crea el bucket 'evidence' 
-- manualmente desde el dashboard de Supabase (Sección Storage) y hazlo PÚBLICO.

INSERT INTO storage.buckets (id, name, public)
SELECT 'evidence', 'evidence', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'evidence'
);

-- Políticas de Acceso para el Bucket (Permitir lectura pública y subida)
CREATE POLICY "Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'evidence');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'evidence');
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'evidence');
