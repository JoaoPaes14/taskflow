package com.taskflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ProjectStatsDTO {
    private long totalTasks;
    private long todoTasks;
    private long inProgressTasks;
    private long doneTasks;
    private long archivedTasks;
    private Map<String, Long> tasksByAssignee;
    private Map<String, Long> tasksByPriority;
}
