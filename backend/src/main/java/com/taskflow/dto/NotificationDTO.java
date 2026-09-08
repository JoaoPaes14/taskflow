package com.taskflow.dto;

import com.taskflow.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationDTO {
    private Long id;
    private String type;
    private String message;
    private Long referenceId;
    private String referenceType;
    private Boolean read;
    private LocalDateTime createdAt;

    public static NotificationDTO fromEntity(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .type(n.getType())
                .message(n.getMessage())
                .referenceId(n.getReferenceId())
                .referenceType(n.getReferenceType())
                .read(n.getRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
