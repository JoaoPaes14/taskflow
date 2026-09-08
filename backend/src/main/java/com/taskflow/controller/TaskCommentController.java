package com.taskflow.controller;

import com.taskflow.dto.PageResponseDTO;
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
    public ResponseEntity<?> getComments(
            @PathVariable Long taskId,
            @RequestAttribute("userId") Long userId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null && size != null) {
            PageResponseDTO<TaskCommentDTO> result = commentService.getCommentsPaged(taskId, userId, page, size);
            return ResponseEntity.ok(result);
        }
        List<TaskCommentDTO> comments = commentService.getComments(taskId, userId);
        return ResponseEntity.ok(comments);
    }

    @PostMapping("/tasks/{taskId}/comments")
    public ResponseEntity<TaskCommentDTO> addComment(
            @PathVariable Long taskId,
            @Valid @RequestBody TaskCommentRequestDTO request,
            @RequestAttribute("userId") Long userId) {
        TaskCommentDTO comment = commentService.addComment(taskId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @PutMapping("/tasks/{taskId}/comments/{commentId}")
    public ResponseEntity<TaskCommentDTO> updateComment(
            @PathVariable Long taskId,
            @PathVariable Long commentId,
            @Valid @RequestBody TaskCommentRequestDTO request,
            @RequestAttribute("userId") Long userId) {
        TaskCommentDTO comment = commentService.updateComment(commentId, request.getContent(), userId);
        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/tasks/{taskId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long taskId,
            @PathVariable Long commentId,
            @RequestAttribute("userId") Long userId) {
        commentService.deleteComment(commentId, userId);
        return ResponseEntity.noContent().build();
    }
}
