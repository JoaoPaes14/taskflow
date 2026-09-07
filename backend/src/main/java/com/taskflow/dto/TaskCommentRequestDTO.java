package com.taskflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskCommentRequestDTO {

    @NotBlank(message = "Comment content is required")
    @Size(max = 500, message = "Comment must be at most 500 characters")
    private String content;
}