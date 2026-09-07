package com.taskflow.dto;

import com.taskflow.entity.TaskLabel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskLabelDTO {
    private Long id;
    private Long projectId;
    private String name;
    private String color;

    public static TaskLabelDTO fromEntity(TaskLabel label) {
        return TaskLabelDTO.builder()
                .id(label.getId())
                .projectId(label.getProject().getId())
                .name(label.getName())
                .color(label.getColor())
                .build();
    }
}
