-- V3: Add subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    completed BIT(1) NOT NULL DEFAULT b'0',
    `position` INT NOT NULL,
    task_id BIGINT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_subtask_task FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE
);
