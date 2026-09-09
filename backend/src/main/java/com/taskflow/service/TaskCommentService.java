package com.taskflow.service;

import com.taskflow.dto.PageResponseDTO;
import com.taskflow.dto.TaskCommentDTO;
import com.taskflow.dto.TaskCommentRequestDTO;
import com.taskflow.entity.ProjectActivity;
import com.taskflow.entity.ProjectTask;
import com.taskflow.entity.TaskComment;
import com.taskflow.entity.User;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.exception.UnauthorizedException;
import com.taskflow.repository.ProjectTaskRepository;
import com.taskflow.repository.TaskCommentRepository;
import com.taskflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taskflow.event.CommentEvent;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskCommentService {

    private final TaskCommentRepository commentRepository;
    private final ProjectTaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectAccessService accessService;
    private final ProjectActivityService activityService;
    private final NotificationService notificationService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<TaskCommentDTO> getComments(Long taskId, Long userId) {
        ProjectTask task = getTask(taskId);
        accessService.requireMember(task.getProject().getId(), userId);
        return commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId).stream()
                .map(TaskCommentDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "comments", key = "#taskId + ':' + #page + ':' + #size")
    public PageResponseDTO<TaskCommentDTO> getCommentsPaged(Long taskId, Long userId, int page, int size) {
        ProjectTask task = getTask(taskId);
        accessService.requireMember(task.getProject().getId(), userId);
        Pageable pageable = PageRequest.of(page, size);
        Page<TaskComment> result = commentRepository.findByTaskIdOrderByCreatedAtAscPaged(taskId, pageable);
        List<TaskCommentDTO> content = result.getContent().stream()
                .map(TaskCommentDTO::fromEntity)
                .collect(Collectors.toList());
        return PageResponseDTO.of(content, page, size, result.getTotalElements());
    }

    @Transactional
    @CacheEvict(value = "comments", allEntries = true)
    public TaskCommentDTO addComment(Long taskId, TaskCommentRequestDTO request, Long userId) {
        ProjectTask task = getTask(taskId);
        accessService.requireMember(task.getProject().getId(), userId);

        User author = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        TaskComment comment = commentRepository.save(TaskComment.builder()
                .task(task)
                .author(author)
                .content(request.getContent().trim())
                .build());

        activityService.record(task.getProject(), author, ProjectActivity.ActionType.COMMENT_ADDED,
                author.getName() + " comentou na tarefa \"" + task.getTitle() + "\"");

        if (task.getAssignee() != null && !task.getAssignee().getId().equals(author.getId())) {
            notificationService.send(task.getAssignee().getId(), "COMMENT_ADDED",
                    author.getName() + " comentou na tarefa \"" + task.getTitle() + "\"",
                    task.getId(), "TASK");
        }
        if (task.getCreatedBy() != null && !task.getCreatedBy().getId().equals(author.getId())
                && (task.getAssignee() == null || !task.getCreatedBy().getId().equals(task.getAssignee().getId()))) {
            notificationService.send(task.getCreatedBy().getId(), "COMMENT_ADDED",
                    author.getName() + " comentou na tarefa \"" + task.getTitle() + "\"",
                    task.getId(), "TASK");
        }

        eventPublisher.publishEvent(new CommentEvent(this, task.getId(), "COMMENT_CREATED", TaskCommentDTO.fromEntity(comment)));

        return TaskCommentDTO.fromEntity(comment);
    }

    @Transactional
    @CacheEvict(value = "comments", allEntries = true)
    public TaskCommentDTO updateComment(Long commentId, String content, Long userId) {
        TaskComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        if (!comment.getAuthor().getId().equals(userId)) {
            throw new UnauthorizedException("Only the author can edit this comment");
        }
        comment.setContent(content.trim());
        TaskComment saved = commentRepository.save(comment);
        eventPublisher.publishEvent(new CommentEvent(this, comment.getTask().getId(), "COMMENT_UPDATED", TaskCommentDTO.fromEntity(saved)));
        return TaskCommentDTO.fromEntity(saved);
    }

    @Transactional
    @CacheEvict(value = "comments", allEntries = true)
    public void deleteComment(Long commentId, Long userId) {
        TaskComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        if (!comment.getAuthor().getId().equals(userId)) {
            throw new UnauthorizedException("Only the author can delete this comment");
        }
        Long taskId = comment.getTask().getId();
        commentRepository.delete(comment);
        eventPublisher.publishEvent(new CommentEvent(this, taskId, "COMMENT_DELETED", Map.of("commentId", commentId)));
    }

    private ProjectTask getTask(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }
}
