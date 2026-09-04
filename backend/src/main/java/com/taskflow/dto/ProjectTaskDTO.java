package com.taskflow.dto;

import com.taskflow.entity.ProjectTask;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectTaskDTO {

    private Long id;
    private Long projectId;
    private String title;
    private String description;
    private ProjectTask.TaskStatus status;
    private ProjectTask.TaskPriority priority;
    private LocalDate dueDate;
    private Integer position;

    private Long assigneeId;
    private String assigneeName;

    private Long createdById;
    private String createdByName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProjectTaskDTO fromEntity(ProjectTask task) {
        ProjectTaskDTO dto = ProjectTaskDTO.builder()
                .id(task.getId())
                .projectId(task.getProject() != null ? task.getProject().getId() : null)
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .dueDate(task.getDueDate())
                .position(task.getPosition())
                .createdById(task.getCreatedBy() != null ? task.getCreatedBy().getId() : null)
                .createdByName(task.getCreatedBy() != null ? task.getCreatedBy().getName() : null)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();

        if (task.getAssignee() != null) {
            dto.setAssigneeId(task.getAssignee().getId());
            dto.setAssigneeName(task.getAssignee().getName());
        }

        return dto;
    }
}
