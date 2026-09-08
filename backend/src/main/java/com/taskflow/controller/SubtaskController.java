package com.taskflow.controller;

import com.taskflow.dto.SubtaskDTO;
import com.taskflow.dto.SubtaskRequestDTO;
import com.taskflow.service.SubtaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks/{taskId}/subtasks")
@RequiredArgsConstructor
public class SubtaskController {

    private final SubtaskService subtaskService;

    @GetMapping
    public ResponseEntity<List<SubtaskDTO>> getSubtasks(
            @PathVariable Long taskId,
            @RequestAttribute("userId") Long userId) {
        return ResponseEntity.ok(subtaskService.getSubtasks(taskId, userId));
    }

    @PostMapping
    public ResponseEntity<SubtaskDTO> createSubtask(
            @PathVariable Long taskId,
            @Valid @RequestBody SubtaskRequestDTO request,
            @RequestAttribute("userId") Long userId) {
        SubtaskDTO subtask = subtaskService.createSubtask(taskId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(subtask);
    }

    @PatchMapping("/{subtaskId}/toggle")
    public ResponseEntity<SubtaskDTO> toggleSubtask(
            @PathVariable Long taskId,
            @PathVariable Long subtaskId,
            @RequestAttribute("userId") Long userId) {
        return ResponseEntity.ok(subtaskService.toggleSubtask(subtaskId, userId));
    }

    @DeleteMapping("/{subtaskId}")
    public ResponseEntity<Void> deleteSubtask(
            @PathVariable Long taskId,
            @PathVariable Long subtaskId,
            @RequestAttribute("userId") Long userId) {
        subtaskService.deleteSubtask(subtaskId, userId);
        return ResponseEntity.noContent().build();
    }
}
