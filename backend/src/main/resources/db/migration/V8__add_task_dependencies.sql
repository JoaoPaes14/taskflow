CREATE TABLE task_dependencies (
    task_id BIGINT NOT NULL,
    depends_on_id BIGINT NOT NULL,
    PRIMARY KEY (task_id, depends_on_id),
    FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_id) REFERENCES project_tasks(id) ON DELETE CASCADE
);
