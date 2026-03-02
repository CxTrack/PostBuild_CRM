-- Prevent duplicate pending invitations for the same email+org pair.
-- The frontend catches 'duplicate' in error text but without this index
-- that check never triggers. Two rapid clicks could create duplicate rows.
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_invitations_unique_pending
  ON team_invitations (organization_id, email)
  WHERE status = 'pending';
