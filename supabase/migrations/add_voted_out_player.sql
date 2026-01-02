-- Add voted_out_player_id column to store Game Master's selection
ALTER TABLE rounds 
ADD COLUMN IF NOT EXISTS voted_out_player_id UUID REFERENCES users(id);

