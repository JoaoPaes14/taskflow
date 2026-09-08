ALTER TABLE project_tasks ADD COLUMN recurrence VARCHAR(20) DEFAULT 'NONE';
ALTER TABLE project_tasks ADD COLUMN next_recurrence_date DATE;
