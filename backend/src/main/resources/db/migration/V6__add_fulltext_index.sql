ALTER TABLE project_tasks ADD FULLTEXT INDEX ft_tasks_title_desc (title, description);
