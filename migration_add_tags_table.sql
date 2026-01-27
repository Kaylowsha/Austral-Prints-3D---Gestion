-- Table to store pre-defined tags for orders and expenses
CREATE TABLE IF NOT EXISTS tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Initial tags based on common usage
INSERT INTO tags (name, color) VALUES 
('San Valentín', '#f43f5e'),
('Día de la Madre', '#ec4899'),
('Día del Padre', '#3b82f6'),
('Navidad', '#10b981'),
('Quelén', '#6366f1')
ON CONFLICT (name) DO NOTHING;
