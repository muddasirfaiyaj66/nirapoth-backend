-- Appeal System and Police Transparency Enhancement
-- This migration adds:
-- 1. Appeal functionality for rejected citizen reports
-- 2. Additional police reviewer information
-- 3. Notification system tables

-- Add appeal-related fields to CitizenReport
ALTER TABLE citizen_reports 
ADD COLUMN appeal_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN appeal_reason TEXT,
ADD COLUMN appeal_reviewed_by TEXT,
ADD COLUMN appeal_reviewed_at TIMESTAMP,
ADD COLUMN appeal_status TEXT CHECK (appeal_status IN ('PENDING', 'APPROVED', 'REJECTED')),
ADD COLUMN appeal_notes TEXT,
ADD COLUMN reviewer_badge_number TEXT,
ADD COLUMN reviewer_station_id TEXT,
ADD COLUMN additional_penalty_applied BOOLEAN DEFAULT FALSE,
ADD COLUMN additional_penalty_amount DECIMAL(10, 2) DEFAULT 0;

-- Add foreign key for appeal reviewer
ALTER TABLE citizen_reports
ADD CONSTRAINT fk_appeal_reviewer 
FOREIGN KEY (appeal_reviewed_by) REFERENCES users(id);

-- Create Notification table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'REPORT_SUBMITTED',
    'REPORT_APPROVED', 
    'REPORT_REJECTED',
    'APPEAL_SUBMITTED',
    'APPEAL_APPROVED',
    'APPEAL_REJECTED',
    'REWARD_EARNED',
    'PENALTY_APPLIED',
    'DEBT_CREATED',
    'PAYMENT_RECEIVED',
    'SYSTEM',
    'INFO',
    'WARNING',
    'SUCCESS',
    'ERROR'
  )),
  
  related_entity_type TEXT,
  related_entity_id TEXT,
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  
  action_url TEXT,
  action_label TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  metadata JSONB
);

-- Create indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- Create indexes for citizen reports appeal fields
CREATE INDEX idx_citizen_reports_appeal_status ON citizen_reports(appeal_status) WHERE appeal_status IS NOT NULL;
CREATE INDEX idx_citizen_reports_appeal_submitted ON citizen_reports(appeal_submitted) WHERE appeal_submitted = TRUE;

-- Add comments
COMMENT ON TABLE notifications IS 'System notifications for all user actions and events';
COMMENT ON COLUMN citizen_reports.appeal_submitted IS 'Whether citizen has submitted an appeal for rejection';
COMMENT ON COLUMN citizen_reports.appeal_status IS 'Status of the appeal: PENDING, APPROVED, REJECTED';
COMMENT ON COLUMN citizen_reports.additional_penalty_applied IS 'Whether additional 1.5% penalty was applied after failed appeal';
COMMENT ON COLUMN citizen_reports.additional_penalty_amount IS 'Additional penalty amount (1.5% of original penalty)';
