package com.taskflow.service;

import com.taskflow.dto.ProjectTaskRequestDTO;
import com.taskflow.dto.UpdateTaskStatusDTO;
import com.taskflow.entity.Project;
import com.taskflow.entity.ProjectTask;
import com.taskflow.entity.Role;
import com.taskflow.entity.User;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.exception.UnauthorizedException;
import com.taskflow.repository.ProjectMemberRepository;
import com.taskflow.repository.ProjectRepository;
import com.taskflow.repository.ProjectTaskRepository;
import com.taskflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectTaskServiceTest {

    @Mock
    private ProjectTaskRepository taskRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectMemberRepository projectMemberRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProjectTaskService taskService;

    private User owner;
    private Project project;
    private ProjectTask task;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L).name("João").email("j@j.com").password("x").role(Role.MEMBER).build();

        project = Project.builder()
                .id(10L).name("Site").status(Project.ProjectStatus.ACTIVE).createdBy(owner).build();

        task = ProjectTask.builder()
                .id(100L)
                .title("Tarefa 1")
                .status(ProjectTask.TaskStatus.TODO)
                .priority(ProjectTask.TaskPriority.MEDIUM)
                .position(0)
                .project(project)
                .createdBy(owner)
                .build();
    }

    @Test
    void getTasks_allowsMember() {
        when(projectRepository.isUserMember(10L, 1L)).thenReturn(true);
        when(taskRepository.findByProjectIdOrdered(10L)).thenReturn(java.util.List.of());

        assertDoesNotThrow(() -> taskService.getTasks(10L, 1L));
    }

    @Test
    void getTasks_deniesNonMember() {
        when(projectRepository.isUserMember(10L, 999L)).thenReturn(false);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        assertThrows(UnauthorizedException.class, () -> taskService.getTasks(10L, 999L));
    }

    @Test
    void createTask_allowsMember() {
        ProjectTaskRequestDTO req = new ProjectTaskRequestDTO(
                "Nova", null, ProjectTask.TaskStatus.TODO,
                ProjectTask.TaskPriority.HIGH, null, null);
        when(projectRepository.isUserMember(10L, 1L)).thenReturn(true);
        when(projectRepository.findActiveById(10L)).thenReturn(Optional.of(project));
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(taskRepository.countByProjectIdAndStatus(10L, ProjectTask.TaskStatus.TODO)).thenReturn(2L);
        when(taskRepository.save(org.mockito.ArgumentMatchers.any(ProjectTask.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        var result = taskService.createTask(10L, req, 1L);

        org.junit.jupiter.api.Assertions.assertEquals("Nova", result.getTitle());
    }

    @Test
    void createTask_deniesNonMember() {
        ProjectTaskRequestDTO req = new ProjectTaskRequestDTO("Nova", null, null, null, null, null);
        when(projectRepository.isUserMember(10L, 999L)).thenReturn(false);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        assertThrows(UnauthorizedException.class, () -> taskService.createTask(10L, req, 999L));
    }

    @Test
    void createTask_rejectsAssigneeOutsideProject() {
        User outsider = User.builder()
                .id(2L).name("Maria").email("m@m.com").password("x").role(Role.MEMBER).build();
        ProjectTaskRequestDTO req = new ProjectTaskRequestDTO(
                "Nova", null, ProjectTask.TaskStatus.TODO,
                ProjectTask.TaskPriority.MEDIUM, null, 2L);
        when(projectRepository.isUserMember(10L, 1L)).thenReturn(true);
        when(projectRepository.findActiveById(10L)).thenReturn(Optional.of(project));
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(projectMemberRepository.existsByProjectIdAndUserId(10L, 2L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> taskService.createTask(10L, req, 1L));
    }

    @Test
    void updateTaskStatus_allowsMember() {
        UpdateTaskStatusDTO dto = new UpdateTaskStatusDTO(ProjectTask.TaskStatus.DONE, 0);
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        when(projectRepository.isUserMember(10L, 1L)).thenReturn(true);
        when(taskRepository.save(org.mockito.ArgumentMatchers.any(ProjectTask.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        var result = taskService.updateTaskStatus(100L, dto, 1L);

        org.junit.jupiter.api.Assertions.assertEquals(ProjectTask.TaskStatus.DONE, result.getStatus());
    }

    @Test
    void updateTaskStatus_requiresTaskAccess() {
        UpdateTaskStatusDTO dto = new UpdateTaskStatusDTO(ProjectTask.TaskStatus.DONE, 0);
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        when(projectRepository.isUserMember(10L, 999L)).thenReturn(false);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        assertThrows(UnauthorizedException.class, () -> taskService.updateTaskStatus(100L, dto, 999L));
    }

    @Test
    void updateTaskStatus_throwsNotFoundWhenTaskMissing() {
        when(taskRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> taskService.updateTaskStatus(999L, new UpdateTaskStatusDTO(ProjectTask.TaskStatus.DONE, 0), 1L));
    }
}
