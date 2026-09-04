package com.taskflow.dto;

import com.taskflow.entity.ProjectTask;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTaskStatusDTO {

    @NotNull(message = "Status is required")
    private ProjectTask.TaskStatus status;

    @Min(value = 0, message = "Position must be zero or greater")
    private Integer position;
}
