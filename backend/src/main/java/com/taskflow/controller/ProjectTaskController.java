package com.taskflow.controller;

import com.taskflow.dto.BatchStatusRequest;
import com.taskflow.dto.PageResponseDTO;
import com.taskflow.dto.ProjectStatsDTO;
import com.taskflow.dto.ProjectTaskDTO;
import com.taskflow.dto.ProjectTaskRequestDTO;
import com.taskflow.dto.UpdateTaskStatusDTO;
import com.taskflow.service.ProjectTaskService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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

    @GetMapping("/tasks/my")
    public ResponseEntity<List<ProjectTaskDTO>> getMyTasks(
            @RequestAttribute("userId") Long userId) {
        return ResponseEntity.ok(taskService.getMyTasks(userId));
    }

    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<?> getTasks(
            @PathVariable Long projectId,
            @RequestAttribute("userId") Long userId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null && size != null) {
            PageResponseDTO<ProjectTaskDTO> result = taskService.getTasksPaged(projectId, userId, page, size);
            return ResponseEntity.ok(result);
        }
        List<ProjectTaskDTO> tasks = taskService.getTasks(projectId, userId);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/projects/{projectId}/stats")
    public ResponseEntity<ProjectStatsDTO> getStats(
            @PathVariable Long projectId,
            @RequestAttribute("userId") Long userId) {
        return ResponseEntity.ok(taskService.getStats(projectId, userId));
    }

    @GetMapping("/projects/{projectId}/search")
    public ResponseEntity<List<ProjectTaskDTO>> search(
            @PathVariable Long projectId,
            @RequestParam String q,
            @RequestAttribute("userId") Long userId) {
        return ResponseEntity.ok(taskService.searchTasks(projectId, q, userId));
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

    @PatchMapping("/tasks/{taskId}/archive")
    public ResponseEntity<Void> archiveTask(
            @PathVariable Long taskId,
            @RequestAttribute("userId") Long userId) {
        taskService.archiveTask(taskId, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/tasks/{taskId}/restore")
    public ResponseEntity<Void> restoreTask(
            @PathVariable Long taskId,
            @RequestAttribute("userId") Long userId) {
        taskService.restoreTask(taskId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/projects/{projectId}/export")
    public ResponseEntity<?> exportProject(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "json") String format,
            @RequestAttribute("userId") Long userId) {
        List<ProjectTaskDTO> tasks = taskService.getTasks(projectId, userId);
        if ("csv".equalsIgnoreCase(format)) {
            StringBuilder csv = new StringBuilder();
            csv.append("ID,Titulo,Descricao,Status,Prioridade,Data Limite,Responsavel,Criado em\n");
            for (ProjectTaskDTO t : tasks) {
                csv.append(String.format("%d,\"%s\",\"%s\",%s,%s,%s,\"%s\",%s\n",
                        t.getId(),
                        escape(t.getTitle()),
                        escape(t.getDescription()),
                        t.getStatus(),
                        t.getPriority(),
                        t.getDueDate() != null ? t.getDueDate() : "",
                        escape(t.getAssigneeName()),
                        t.getCreatedAt()));
            }
            return ResponseEntity.ok()
                    .header("Content-Type", "text/csv")
                    .header("Content-Disposition", "attachment; filename=projeto_" + projectId + ".csv")
                    .body(csv.toString());
        }
        return ResponseEntity.ok(tasks);
    }

    @PostMapping("/projects/{projectId}/import")
    public ResponseEntity<List<ProjectTaskDTO>> importTasks(
            @PathVariable Long projectId,
            @Valid @RequestBody @Size(max = 200) List<@Valid ProjectTaskRequestDTO> requests,
            @RequestAttribute("userId") Long userId) {
        List<ProjectTaskDTO> created = new java.util.ArrayList<>();
        for (ProjectTaskRequestDTO req : requests) {
            created.add(taskService.createTask(projectId, req, userId));
        }
        return ResponseEntity.ok(created);
    }

    @PatchMapping("/tasks/batch/archive")
    public ResponseEntity<Void> batchArchive(
            @Valid @RequestBody @Size(max = 100) List<@NotNull Long> taskIds,
            @RequestAttribute("userId") Long userId) {
        taskService.archiveTasksBatch(taskIds, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/tasks/batch/status")
    public ResponseEntity<Void> batchUpdateStatus(
            @Valid @RequestBody BatchStatusRequest request,
            @RequestAttribute("userId") Long userId) {
        taskService.updateTaskStatusBatch(request.getTaskIds(), request.getStatus(), userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/tasks/batch")
    public ResponseEntity<Void> batchDelete(
            @Valid @RequestBody @Size(max = 100) List<@NotNull Long> taskIds,
            @RequestAttribute("userId") Long userId) {
        taskService.deleteTasksBatch(taskIds, userId);
        return ResponseEntity.noContent().build();
    }

    private String escape(String s) {
        if (s == null) return "";
        String value = s.replace("\"", "\"\"");
        if (!value.isEmpty() && "+-=@\t\r".indexOf(value.charAt(0)) >= 0) {
            return "'" + value;
        }
        return value;
    }
}
