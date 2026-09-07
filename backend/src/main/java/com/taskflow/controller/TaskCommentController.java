package com.taskflow.controller;

import com.taskflow.dto.TaskCommentDTO;
import com.taskflow.dto.TaskCommentRequestDTO;
import com.taskflow.service.TaskCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TaskCommentController {

    private final TaskCommentService commentService;

    @GetMapping("/tasks/{taskId}/comments")
    public ResponseEntity<List<TaskCommentDTO>> getComments(
            @PathVariable Long taskId,
            @RequestAttribute("userId") Long userId) {
        return ResponseEntity.ok(commentService.getComments(taskId, userId));
    }

    @PostMapping("/tasks/{taskId}/comments")
    public ResponseEntity<TaskCommentDTO> addComment(
            @PathVariable Long taskId,
            @Valid @RequestBody TaskCommentRequestDTO request,
            @RequestAttribute("userId") Long userId) {
        TaskCommentDTO comment = commentService.addComment(taskId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }
}