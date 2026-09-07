-- V2: Add task labels, task archived flag

-- Add archived flag to tasks (soft delete)
ALTER TABLE project_tasks ADD COLUMN archived BIT(1) NOT NULL DEFAULT b'0';

-- Labels table
CREATE TABLE IF NOT EXISTS task_labels (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    CONSTRAINT fk_label_project FOREIGN KEY (project_id) REFERENCES projects(id),
    UNIQUE KEY uk_project_label_name (project_id, name)
);

-- Many-to-many: task <-> label
CREATE TABLE IF NOT EXISTS task_label_entries (
    task_id BIGINT NOT NULL,
    label_id BIGINT NOT NULL,
    PRIMARY KEY (task_id, label_id),
    CONSTRAINT fk_tle_task FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_tle_label FOREIGN KEY (label_id) REFERENCES task_labels(id) ON DELETE CASCADE
);
