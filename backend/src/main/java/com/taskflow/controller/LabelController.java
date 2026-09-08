package com.taskflow.controller;

import com.taskflow.dto.TaskLabelDTO;
import com.taskflow.dto.TaskLabelRequestDTO;
import com.taskflow.service.LabelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/labels")
@RequiredArgsConstructor
public class LabelController {

    private final LabelService labelService;

    @GetMapping
    public ResponseEntity<List<TaskLabelDTO>> getLabels(
            @PathVariable Long projectId,
            @RequestAttribute("userId") Long userId) {
        return ResponseEntity.ok(labelService.getLabels(projectId, userId));
    }

    @PostMapping
    public ResponseEntity<TaskLabelDTO> createLabel(
            @PathVariable Long projectId,
            @Valid @RequestBody TaskLabelRequestDTO request,
            @RequestAttribute("userId") Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(labelService.createLabel(projectId, request, userId));
    }

    @PutMapping("/{labelId}")
    public ResponseEntity<TaskLabelDTO> updateLabel(
            @PathVariable Long projectId,
            @PathVariable Long labelId,
            @Valid @RequestBody TaskLabelRequestDTO request,
            @RequestAttribute("userId") Long userId) {
        return ResponseEntity.ok(labelService.updateLabel(labelId, request, userId));
    }

    @DeleteMapping("/{labelId}")
    public ResponseEntity<Void> deleteLabel(
            @PathVariable Long projectId,
            @PathVariable Long labelId,
            @RequestAttribute("userId") Long userId) {
        labelService.deleteLabel(labelId, userId);
        return ResponseEntity.noContent().build();
    }
}
