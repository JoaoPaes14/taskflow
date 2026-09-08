package com.taskflow.service;

import com.taskflow.dto.PageResponseDTO;
import com.taskflow.dto.ProjectTaskDTO;
import com.taskflow.dto.ProjectTaskRequestDTO;
import com.taskflow.dto.UpdateTaskStatusDTO;
import com.taskflow.entity.Project;
import com.taskflow.entity.ProjectActivity;
import com.taskflow.entity.ProjectTask;
import com.taskflow.entity.TaskLabel;
import com.taskflow.entity.User;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.exception.UnauthorizedException;
import com.taskflow.repository.ProjectMemberRepository;
import com.taskflow.repository.ProjectRepository;
import com.taskflow.repository.ProjectTaskRepository;
import com.taskflow.repository.TaskLabelRepository;
import com.taskflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectTaskService {

    private final ProjectTaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final TaskLabelRepository labelRepository;
    private final ProjectActivityService activityService;
    private final NotificationService notificationService;

    @Cacheable(value = "tasks", key = "#projectId")
    public List<ProjectTaskDTO> getTasks(Long projectId, Long userId) {
        requireAccess(projectId, userId);
        return taskRepository.findByProjectIdOrdered(projectId).stream()
                .map(ProjectTaskDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public PageResponseDTO<ProjectTaskDTO> getTasksPaged(Long projectId, Long userId, int page, int size) {
        requireAccess(projectId, userId);
        Pageable pageable = PageRequest.of(page, size);
        Page<ProjectTask> result = taskRepository.findByProjectIdOrderedPaged(projectId, pageable);
        List<ProjectTaskDTO> content = result.getContent().stream()
                .map(ProjectTaskDTO::fromEntity)
                .collect(Collectors.toList());
        return PageResponseDTO.of(content, page, size, result.getTotalElements());
    }

    @CacheEvict(value = "tasks", key = "#projectId")
    public ProjectTaskDTO createTask(Long projectId, ProjectTaskRequestDTO request, Long userId) {
        requireAccess(projectId, userId);

        Project project = projectRepository.findActiveById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        User assignee = resolveAssignee(projectId, request.getAssigneeId());
        Set<TaskLabel> labels = resolveLabels(projectId, request.getLabelIds());

        int position = (int) taskRepository.countByProjectIdAndStatusAndArchived(
                projectId, request.getStatus() != null ? request.getStatus() : ProjectTask.TaskStatus.TODO, false);

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
                .labels(labels)
                .build();

        ProjectTask saved = taskRepository.save(task);

        activityService.record(project, creator, ProjectActivity.ActionType.TASK_CREATED,
                creator.getName() + " criou a tarefa \"" + saved.getTitle() + "\"");

        if (assignee != null && !assignee.getId().equals(creator.getId())) {
            notificationService.send(assignee.getId(), "TASK_ASSIGNED",
                    creator.getName() + " atribuiu a tarefa \"" + saved.getTitle() + "\" a voce",
                    saved.getId(), "TASK");
        }

        return ProjectTaskDTO.fromEntity(saved);
    }

    @CacheEvict(value = "tasks", allEntries = true)
    public ProjectTaskDTO updateTask(Long taskId, ProjectTaskRequestDTO request, Long userId) {
        ProjectTask task = getOwnedTask(taskId);
        requireAccess(task.getProject().getId(), userId);

        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ProjectTask.TaskStatus previousStatus = task.getStatus();
        User assignee = resolveAssignee(task.getProject().getId(), request.getAssigneeId());
        Set<TaskLabel> labels = request.getLabelIds() != null
                ? resolveLabels(task.getProject().getId(), request.getLabelIds())
                : task.getLabels();

        task.setTitle(request.getTitle() != null ? request.getTitle() : task.getTitle());
        task.setDescription(request.getDescription() != null ? request.getDescription() : task.getDescription());
        task.setStatus(request.getStatus() != null ? request.getStatus() : task.getStatus());
        task.setPriority(request.getPriority() != null ? request.getPriority() : task.getPriority());
        task.setDueDate(request.getDueDate() != null ? request.getDueDate() : task.getDueDate());
        task.setAssignee(assignee != null ? assignee : task.getAssignee());
        task.setLabels(labels);

        if (request.getStatus() != null && request.getStatus() != previousStatus) {
            task.setPosition((int) taskRepository.countByProjectIdAndStatusAndArchived(
                    task.getProject().getId(), task.getStatus(), false));
            renormalizeColumn(task.getProject().getId(), previousStatus);
        }

        ProjectTask saved = taskRepository.save(task);

        activityService.record(task.getProject(), actor, ProjectActivity.ActionType.TASK_UPDATED,
                actor.getName() + " atualizou a tarefa \"" + saved.getTitle() + "\"");

        if (assignee != null && !assignee.getId().equals(userId)
                && (task.getAssignee() == null || !task.getAssignee().getId().equals(assignee.getId()))) {
            notificationService.send(assignee.getId(), "TASK_ASSIGNED",
                    actor.getName() + " atribuiu a tarefa \"" + saved.getTitle() + "\" a voce",
                    saved.getId(), "TASK");
        }

        return ProjectTaskDTO.fromEntity(saved);
    }

    @CacheEvict(value = "tasks", allEntries = true)
    public ProjectTaskDTO updateTaskStatus(Long taskId, UpdateTaskStatusDTO request, Long userId) {
        ProjectTask task = getOwnedTask(taskId);
        requireAccess(task.getProject().getId(), userId);

        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ProjectTask.TaskStatus previousStatus = task.getStatus();
        Long projectId = task.getProject().getId();

        task.setStatus(request.getStatus());

        if (request.getStatus() != previousStatus) {
            task.setPosition((int) taskRepository.countByProjectIdAndStatusAndArchived(projectId, request.getStatus(), false));
        } else if (request.getPosition() != null) {
            task.setPosition(request.getPosition());
        }

        ProjectTask saved = taskRepository.save(task);

        if (previousStatus != saved.getStatus()) {
            renormalizeColumn(projectId, previousStatus);
            renormalizeColumn(projectId, saved.getStatus());
        } else if (request.getPosition() != null) {
            renormalizeColumn(projectId, saved.getStatus());
        }

        String statusLabel = statusLabel(saved.getStatus());
        activityService.record(saved.getProject(), actor, ProjectActivity.ActionType.TASK_MOVED,
                actor.getName() + " moveu a tarefa \"" + saved.getTitle() + "\" para " + statusLabel);

        return ProjectTaskDTO.fromEntity(saved);
    }

    @CacheEvict(value = "tasks", allEntries = true)
    public void archiveTask(Long taskId, Long userId) {
        ProjectTask task = getOwnedTask(taskId);
        requireAccess(task.getProject().getId(), userId);
        task.setArchived(true);
        taskRepository.save(task);
        renormalizeColumn(task.getProject().getId(), task.getStatus());
    }

    @CacheEvict(value = "tasks", allEntries = true)
    public void restoreTask(Long taskId, Long userId) {
        ProjectTask task = getOwnedTask(taskId);
        requireAccess(task.getProject().getId(), userId);
        task.setArchived(false);
        task.setPosition((int) taskRepository.countByProjectIdAndStatusAndArchived(
                task.getProject().getId(), task.getStatus(), false));
        taskRepository.save(task);
    }

    @CacheEvict(value = "tasks", allEntries = true)
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
        taskRepository.flush();
        renormalizeColumn(projectId, status);

        activityService.record(project, actor, ProjectActivity.ActionType.TASK_DELETED,
                actor.getName() + " excluiu a tarefa \"" + title + "\"");
    }

    private void renormalizeColumn(Long projectId, ProjectTask.TaskStatus status) {
        List<ProjectTask> tasks = taskRepository.findByProjectIdAndStatusOrdered(projectId, status);
        boolean changed = false;
        for (int i = 0; i < tasks.size(); i++) {
            ProjectTask task = tasks.get(i);
            if (task.getPosition() == null || task.getPosition() != i) {
                task.setPosition(i);
                changed = true;
            }
        }
        if (changed) {
            taskRepository.saveAll(tasks);
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

    private Set<TaskLabel> resolveLabels(Long projectId, List<Long> labelIds) {
        if (labelIds == null) {
            return new HashSet<>();
        }
        Set<TaskLabel> labels = new HashSet<>();
        for (Long labelId : labelIds) {
            TaskLabel label = labelRepository.findById(labelId)
                    .orElseThrow(() -> new ResourceNotFoundException("Label not found"));
            if (!label.getProject().getId().equals(projectId)) {
                throw new UnauthorizedException("Label does not belong to this project");
            }
            labels.add(label);
        }
        return labels;
    }

    private void requireAccess(Long projectId, Long userId) {
        if (!projectRepository.isUserMember(projectId, userId)
                && !projectRepository.findActiveById(projectId)
                        .map(p -> p.getCreatedBy().getId().equals(userId))
                        .orElse(false)) {
            throw new UnauthorizedException("You don't have permission to access this project");
        }
    }
}
