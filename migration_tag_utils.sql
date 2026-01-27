-- Function to rename a tag across all arrays in orders and expenses
-- Usage: SELECT rename_tag('Quelen', 'Quelén');

CREATE OR REPLACE FUNCTION rename_tag(old_tag TEXT, new_tag TEXT)
RETURNS void AS $$
BEGIN
    -- Update orders table
    UPDATE orders
    SET tags = array_replace(tags, old_tag, new_tag)
    WHERE tags @> ARRAY[old_tag];

    -- Update expenses table
    UPDATE expenses
    SET tags = array_replace(tags, old_tag, new_tag)
    WHERE tags @> ARRAY[old_tag];
END;
$$ LANGUAGE plpgsql;
