package com.taskflow.dto;

import com.taskflow.entity.ProjectActivity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectActivityDTO {

    private Long id;
    private Long projectId;
    private Long actorId;
    private String actorName;
    private ProjectActivity.ActionType action;
    private String message;
    private LocalDateTime createdAt;

    public static ProjectActivityDTO fromEntity(ProjectActivity activity) {
        return ProjectActivityDTO.builder()
                .id(activity.getId())
                .projectId(activity.getProject() != null ? activity.getProject().getId() : null)
                .actorId(activity.getActor() != null ? activity.getActor().getId() : null)
                .actorName(activity.getActor() != null ? activity.getActor().getName() : null)
                .action(activity.getAction())
                .message(activity.getMessage())
                .createdAt(activity.getCreatedAt())
                .build();
    }
}