package com.taskflow.service;

import com.taskflow.dto.TaskCommentDTO;
import com.taskflow.dto.TaskCommentRequestDTO;
import com.taskflow.entity.ProjectActivity;
import com.taskflow.entity.ProjectTask;
import com.taskflow.entity.TaskComment;
import com.taskflow.entity.User;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.repository.ProjectTaskRepository;
import com.taskflow.repository.TaskCommentRepository;
import com.taskflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskCommentService {

    private final TaskCommentRepository commentRepository;
    private final ProjectTaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectAccessService accessService;
    private final ProjectActivityService activityService;

    @Transactional(readOnly = true)
    public List<TaskCommentDTO> getComments(Long taskId, Long userId) {
        ProjectTask task = getTask(taskId);
        accessService.requireMember(task.getProject().getId(), userId);
        return commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId).stream()
                .map(TaskCommentDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
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

        return TaskCommentDTO.fromEntity(comment);
    }

    private ProjectTask getTask(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }
}