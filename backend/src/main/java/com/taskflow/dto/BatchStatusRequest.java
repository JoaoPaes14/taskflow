package com.taskflow.dto;

import com.taskflow.entity.ProjectTask;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchStatusRequest {
    private List<Long> taskIds;
    private ProjectTask.TaskStatus status;
}
