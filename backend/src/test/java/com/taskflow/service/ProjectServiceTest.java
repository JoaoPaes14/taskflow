package com.taskflow.service;

import com.taskflow.dto.ProjectRequestDTO;
import com.taskflow.entity.Project;
import com.taskflow.entity.Role;
import com.taskflow.entity.User;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.exception.UnauthorizedException;
import com.taskflow.repository.ProjectMemberRepository;
import com.taskflow.repository.ProjectRepository;
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
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectMemberRepository projectMemberRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProjectService projectService;

    private User owner;
    private Project project;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L)
                .name("João")
                .email("j@j.com")
                .password("x")
                .role(Role.MEMBER)
                .build();

        project = Project.builder()
                .id(10L)
                .name("Site")
                .description("desc")
                .status(Project.ProjectStatus.ACTIVE)
                .createdBy(owner)
                .build();
    }

    @Test
    void getProjectById_allowsMember() {
        when(projectRepository.findActiveById(10L)).thenReturn(Optional.of(project));
        when(projectRepository.isUserMember(10L, 1L)).thenReturn(true);

        assertDoesNotThrow(() -> projectService.getProjectById(10L, 1L));
    }

    @Test
    void getProjectById_allowsOwner() {
        when(projectRepository.findActiveById(10L)).thenReturn(Optional.of(project));
        when(projectRepository.isUserMember(10L, 1L)).thenReturn(false);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        assertDoesNotThrow(() -> projectService.getProjectById(10L, 1L));
    }

    @Test
    void getProjectById_deniesNonMember() {
        when(projectRepository.findActiveById(10L)).thenReturn(Optional.of(project));
        when(projectRepository.isUserMember(10L, 999L)).thenReturn(false);
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));

        assertThrows(UnauthorizedException.class, () -> projectService.getProjectById(10L, 999L));
    }

    @Test
    void getProjectById_throwsNotFoundWhenMissing() {
        when(projectRepository.findActiveById(10L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> projectService.getProjectById(10L, 1L));
    }

    @Test
    void updateProject_deniesNonOwner() {
        when(projectRepository.findActiveById(10L)).thenReturn(Optional.of(project));

        assertThrows(UnauthorizedException.class,
                () -> projectService.updateProject(10L, new ProjectRequestDTO("X", null), 999L));
    }

    @Test
    void deleteProject_deniesNonOwner() {
        when(projectRepository.findActiveById(10L)).thenReturn(Optional.of(project));

        assertThrows(UnauthorizedException.class,
                () -> projectService.deleteProject(10L, 999L));
    }
}
