package com.taskflow.dto;

import com.taskflow.entity.ProjectTask;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTaskDTO {

    private Long id;
    private Long projectId;
    private String projectName;
    private String title;
    private String description;
    private ProjectTask.TaskStatus status;
    private ProjectTask.TaskPriority priority;
    private LocalDate dueDate;
    private ProjectTask.TaskRecurrence recurrence;
    private Integer position;
    private Boolean archived;

    private Long assigneeId;
    private String assigneeName;

    private Long createdById;
    private String createdByName;

    private List<TaskLabelDTO> labels;

    private List<SubtaskDTO> subtasks;

    private List<Long> dependencyIds;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProjectTaskDTO fromEntity(ProjectTask task) {
        ProjectTaskDTO dto = ProjectTaskDTO.builder()
                .id(task.getId())
                .projectId(task.getProject() != null ? task.getProject().getId() : null)
                .projectName(task.getProject() != null ? task.getProject().getName() : null)
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .dueDate(task.getDueDate())
                .recurrence(task.getRecurrence())
                .position(task.getPosition())
                .archived(task.getArchived())
                .createdById(task.getCreatedBy() != null ? task.getCreatedBy().getId() : null)
                .createdByName(task.getCreatedBy() != null ? task.getCreatedBy().getName() : null)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();

        if (task.getAssignee() != null) {
            dto.setAssigneeId(task.getAssignee().getId());
            dto.setAssigneeName(task.getAssignee().getName());
        }

        if (task.getLabels() != null && !task.getLabels().isEmpty()) {
            dto.setLabels(task.getLabels().stream()
                    .map(TaskLabelDTO::fromEntity)
                    .collect(Collectors.toList()));
        }

        if (task.getSubtasks() != null && !task.getSubtasks().isEmpty()) {
            dto.setSubtasks(task.getSubtasks().stream()
                    .map(SubtaskDTO::fromEntity)
                    .collect(Collectors.toList()));
        }

        if (task.getDependencies() != null && !task.getDependencies().isEmpty()) {
            dto.setDependencyIds(task.getDependencies().stream()
                    .map(ProjectTask::getId)
                    .collect(Collectors.toList()));
        }

        return dto;
    }
}
