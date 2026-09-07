package com.taskflow.service;

import com.taskflow.dto.ProjectTaskDTO;
import com.taskflow.dto.ProjectTaskRequestDTO;
import com.taskflow.dto.UpdateTaskStatusDTO;
import com.taskflow.entity.Project;
import com.taskflow.entity.ProjectActivity;
import com.taskflow.entity.ProjectTask;
import com.taskflow.entity.User;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.exception.UnauthorizedException;
import com.taskflow.repository.ProjectMemberRepository;
import com.taskflow.repository.ProjectRepository;
import com.taskflow.repository.ProjectTaskRepository;
import com.taskflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectTaskService {

    private final ProjectTaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final ProjectActivityService activityService;

    public List<ProjectTaskDTO> getTasks(Long projectId, Long userId) {
        requireAccess(projectId, userId);
        return taskRepository.findByProjectIdOrdered(projectId).stream()
                .map(ProjectTaskDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public ProjectTaskDTO createTask(Long projectId, ProjectTaskRequestDTO request, Long userId) {
        requireAccess(projectId, userId);

        Project project = projectRepository.findActiveById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        User assignee = resolveAssignee(projectId, request.getAssigneeId());

        int position = (int) taskRepository.countByProjectIdAndStatus(
                projectId, request.getStatus() != null ? request.getStatus() : ProjectTask.TaskStatus.TODO);

        ProjectTask task = ProjectTask.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : ProjectTask.TaskStatus.TODO)
                .priority(request.getPriority() != null ? request.getPriority() : ProjectTask.TaskPriority.MEDIUM)
                .dueDate(request.getDueDate())
                .position(position)
                .project(project)
                .assignee(assignee)
                .createdBy(creator)
                .build();

        ProjectTask saved = taskRepository.save(task);

        activityService.record(project, creator, ProjectActivity.ActionType.TASK_CREATED,
                creator.getName() + " criou a tarefa \"" + saved.getTitle() + "\"");

        return ProjectTaskDTO.fromEntity(saved);
    }

    public ProjectTaskDTO updateTask(Long taskId, ProjectTaskRequestDTO request, Long userId) {
        ProjectTask task = getOwnedTask(taskId);
        requireAccess(task.getProject().getId(), userId);

        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ProjectTask.TaskStatus previousStatus = task.getStatus();
        User assignee = resolveAssignee(task.getProject().getId(), request.getAssigneeId());

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus() != null ? request.getStatus() : task.getStatus());
        task.setPriority(request.getPriority() != null ? request.getPriority() : task.getPriority());
        task.setDueDate(request.getDueDate());
        task.setAssignee(assignee);

        if (request.getStatus() != null && request.getStatus() != previousStatus) {
            task.setPosition((int) taskRepository.countByProjectIdAndStatus(
                    task.getProject().getId(), task.getStatus()));
            renormalizeColumn(task.getProject().getId(), previousStatus);
        }

        ProjectTask saved = taskRepository.save(task);

        activityService.record(task.getProject(), actor, ProjectActivity.ActionType.TASK_UPDATED,
                actor.getName() + " atualizou a tarefa \"" + saved.getTitle() + "\"");

        return ProjectTaskDTO.fromEntity(saved);
    }

    public ProjectTaskDTO updateTaskStatus(Long taskId, UpdateTaskStatusDTO request, Long userId) {
        ProjectTask task = getOwnedTask(taskId);
        requireAccess(task.getProject().getId(), userId);

        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ProjectTask.TaskStatus previousStatus = task.getStatus();
        Long projectId = task.getProject().getId();

        task.setStatus(request.getStatus());

        if (request.getStatus() != previousStatus) {
            task.setPosition((int) taskRepository.countByProjectIdAndStatus(projectId, request.getStatus()));
        } else if (request.getPosition() != null) {
            task.setPosition(request.getPosition());
        }

        ProjectTask saved = taskRepository.save(task);

        renormalizeColumn(projectId, previousStatus);
        renormalizeColumn(projectId, saved.getStatus());

        String statusLabel = statusLabel(saved.getStatus());
        activityService.record(saved.getProject(), actor, ProjectActivity.ActionType.TASK_MOVED,
                actor.getName() + " moveu a tarefa \"" + saved.getTitle() + "\" para " + statusLabel);

        return ProjectTaskDTO.fromEntity(saved);
    }

    public void deleteTask(Long taskId, Long userId) {
        ProjectTask task = getOwnedTask(taskId);
        requireAccess(task.getProject().getId(), userId);

        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ProjectTask.TaskStatus status = task.getStatus();
        Project project = task.getProject();
        Long projectId = project.getId();
        String title = task.getTitle();

        taskRepository.delete(task);
        renormalizeColumn(projectId, status);

        activityService.record(project, actor, ProjectActivity.ActionType.TASK_DELETED,
                actor.getName() + " excluiu a tarefa \"" + title + "\"");
    }

    private void renormalizeColumn(Long projectId, ProjectTask.TaskStatus status) {
        List<ProjectTask> tasks = taskRepository.findByProjectIdAndStatusOrdered(projectId, status);
        for (int i = 0; i < tasks.size(); i++) {
            ProjectTask task = tasks.get(i);
            if (task.getPosition() == null || task.getPosition() != i) {
                task.setPosition(i);
                taskRepository.save(task);
            }
        }
    }

    private String statusLabel(ProjectTask.TaskStatus status) {
        return switch (status) {
            case TODO -> "A fazer";
            case IN_PROGRESS -> "Em progresso";
            case DONE -> "Concluído";
        };
    }

    private ProjectTask getOwnedTask(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

    private User resolveAssignee(Long projectId, Long assigneeId) {
        if (assigneeId == null) {
            return null;
        }
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, assigneeId)) {
            throw new ResourceNotFoundException("User is not a member of this project");
        }
        return userRepository.findById(assigneeId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void requireAccess(Long projectId, Long userId) {
        if (!projectRepository.isUserMember(projectId, userId)
                && !projectRepository.findById(projectId)
                        .map(p -> p.getCreatedBy().getId().equals(userId))
                        .orElse(false)) {
            throw new UnauthorizedException("You don't have permission to access this project");
        }
    }
}
