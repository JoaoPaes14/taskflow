package com.taskflow.dto;

import com.taskflow.entity.TaskComment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskCommentDTO {

    private Long id;
    private Long taskId;
    private Long authorId;
    private String authorName;
    private String content;
    private LocalDateTime createdAt;

    public static TaskCommentDTO fromEntity(TaskComment comment) {
        return TaskCommentDTO.builder()
                .id(comment.getId())
                .taskId(comment.getTask() != null ? comment.getTask().getId() : null)
                .authorId(comment.getAuthor() != null ? comment.getAuthor().getId() : null)
                .authorName(comment.getAuthor() != null ? comment.getAuthor().getName() : null)
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}