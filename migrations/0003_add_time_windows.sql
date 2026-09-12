-- Add time window columns to locations table
ALTER TABLE oasis_locations 
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Add helpful comment
COMMENT ON COLUMN oasis_locations.start_time IS 'Clock-in allowed from this time';
COMMENT ON COLUMN oasis_locations.end_time IS 'Clock-out allowed until this time';
