package com.taskflow.dto;

import com.taskflow.entity.Subtask;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubtaskDTO {
    private Long id;
    private Long taskId;
    private String title;
    private Boolean completed;
    private Integer position;
    private LocalDateTime createdAt;

    public static SubtaskDTO fromEntity(Subtask subtask) {
        return SubtaskDTO.builder()
                .id(subtask.getId())
                .taskId(subtask.getTask().getId())
                .title(subtask.getTitle())
                .completed(subtask.getCompleted())
                .position(subtask.getPosition())
                .createdAt(subtask.getCreatedAt())
                .build();
    }
}
