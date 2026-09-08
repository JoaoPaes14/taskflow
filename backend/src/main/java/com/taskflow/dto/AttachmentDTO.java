package com.taskflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AttachmentDTO {
    private Long id;
    private Long taskId;
    private String filename;
    private String originalFilename;
    private String contentType;
    private Long fileSize;
    private Long uploadedById;
    private String uploadedByName;
    private LocalDateTime createdAt;
}
