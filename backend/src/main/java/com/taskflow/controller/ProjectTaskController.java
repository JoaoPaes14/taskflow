package com.taskflow.controller;

import com.taskflow.dto.ProjectTaskDTO;
import com.taskflow.dto.ProjectTaskRequestDTO;
import com.taskflow.dto.UpdateTaskStatusDTO;
import com.taskflow.service.ProjectTaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectTaskController {

    private final ProjectTaskService taskService;

    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<List<ProjectTaskDTO>> getTasks(
            @PathVariable Long projectId,
            @RequestAttribute("userId") Long userId) {
        return ResponseEntity.ok(taskService.getTasks(projectId, userId));
    }

    @PostMapping("/projects/{projectId}/tasks")
    public ResponseEntity<ProjectTaskDTO> createTask(
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectTaskRequestDTO request,
            @RequestAttribute("userId") Long userId) {
        ProjectTaskDTO task = taskService.createTask(projectId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(task);
    }

    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<ProjectTaskDTO> updateTask(
            @PathVariable Long taskId,
            @Valid @RequestBody ProjectTaskRequestDTO request,
            @RequestAttribute("userId") Long userId) {
        return ResponseEntity.ok(taskService.updateTask(taskId, request, userId));
    }

    @PatchMapping("/tasks/{taskId}/status")
    public ResponseEntity<ProjectTaskDTO> updateTaskStatus(
            @PathVariable Long taskId,
            @Valid @RequestBody UpdateTaskStatusDTO request,
            @RequestAttribute("userId") Long userId) {
        return ResponseEntity.ok(taskService.updateTaskStatus(taskId, request, userId));
    }

    @DeleteMapping("/tasks/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long taskId,
            @RequestAttribute("userId") Long userId) {
        taskService.deleteTask(taskId, userId);
        return ResponseEntity.noContent().build();
    }
}
