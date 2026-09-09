package com.taskflow.dto;

import com.taskflow.entity.ProjectTask;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchStatusRequest {
    @NotEmpty
    @Size(max = 100)
    private List<Long> taskIds;
    @NotNull
    private ProjectTask.TaskStatus status;
}
