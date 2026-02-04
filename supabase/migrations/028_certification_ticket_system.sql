-- Create salon_certification_tickets table
-- This tracks the pool of certification tickets owned by a salon
CREATE TABLE salon_certification_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  total_tickets INTEGER NOT NULL DEFAULT 0,
  available_tickets INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT positive_tickets CHECK (total_tickets >= 0 AND available_tickets >= 0),
  CONSTRAINT available_lte_total CHECK (available_tickets <= total_tickets),
  UNIQUE(salon_id)
);

-- Create certification_ticket_assignments table
-- This tracks when tickets are assigned to team members
CREATE TABLE certification_ticket_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  assigned_to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  certification_id UUID NOT NULL REFERENCES certification_settings(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'assigned',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('assigned', 'redeemed', 'expired', 'revoked'))
);

-- Add indexes for common queries
CREATE INDEX idx_salon_cert_tickets_salon_id ON salon_certification_tickets(salon_id);
CREATE INDEX idx_cert_assignments_salon_id ON certification_ticket_assignments(salon_id);
CREATE INDEX idx_cert_assignments_assigned_to ON certification_ticket_assignments(assigned_to_user_id);
CREATE INDEX idx_cert_assignments_status ON certification_ticket_assignments(status);

-- Enable RLS
ALTER TABLE salon_certification_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_ticket_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for salon_certification_tickets
-- Salon owners can view their salon's tickets
CREATE POLICY "Salon owners can view own tickets"
  ON salon_certification_tickets
  FOR SELECT
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Salon owners can update their salon's tickets (for purchasing more)
CREATE POLICY "Salon owners can update own tickets"
  ON salon_certification_tickets
  FOR UPDATE
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Service role can insert/update (for subscription webhooks)
CREATE POLICY "Service role can manage tickets"
  ON salon_certification_tickets
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for certification_ticket_assignments
-- Salon owners can view assignments in their salon
CREATE POLICY "Salon owners can view assignments"
  ON certification_ticket_assignments
  FOR SELECT
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Team members can view their own assignments
CREATE POLICY "Users can view own assignments"
  ON certification_ticket_assignments
  FOR SELECT
  USING (assigned_to_user_id = auth.uid());

-- Salon owners can create assignments (assign tickets)
CREATE POLICY "Salon owners can create assignments"
  ON certification_ticket_assignments
  FOR INSERT
  WITH CHECK (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Salon owners can update assignments (revoke, etc.)
CREATE POLICY "Salon owners can update assignments"
  ON certification_ticket_assignments
  FOR UPDATE
  USING (
    salon_id IN (
      SELECT id FROM salons WHERE owner_id = auth.uid()
    )
  );

-- Service role can manage all assignments
CREATE POLICY "Service role can manage assignments"
  ON certification_ticket_assignments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_certification_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_salon_cert_tickets_timestamp
  BEFORE UPDATE ON salon_certification_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_certification_tickets_updated_at();

CREATE TRIGGER update_cert_assignments_timestamp
  BEFORE UPDATE ON certification_ticket_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_certification_tickets_updated_at();

-- Add comment for documentation
COMMENT ON TABLE salon_certification_tickets IS 'Tracks certification ticket pool for salons. Salon subscription includes 3 free tickets.';
COMMENT ON TABLE certification_ticket_assignments IS 'Tracks certification tickets assigned to team members by salon owners.';
COMMENT ON COLUMN certification_ticket_assignments.status IS 'assigned: ready to use, redeemed: used for certification, expired: past expiration date, revoked: taken back by owner';
