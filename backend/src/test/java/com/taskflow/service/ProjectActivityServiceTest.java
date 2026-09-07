package com.taskflow.service;

import com.taskflow.entity.Project;
import com.taskflow.entity.ProjectActivity;
import com.taskflow.entity.Role;
import com.taskflow.entity.User;
import com.taskflow.exception.UnauthorizedException;
import com.taskflow.repository.ProjectActivityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectActivityServiceTest {

    @Mock
    private ProjectActivityRepository activityRepository;
    @Mock
    private ProjectAccessService accessService;

    @InjectMocks
    private ProjectActivityService activityService;

    private User owner;
    private Project project;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L).name("João").email("j@j.com").password("x").role(Role.MEMBER).build();

        project = Project.builder()
                .id(10L).name("Site").status(Project.ProjectStatus.ACTIVE).createdBy(owner).build();
    }

    @Test
    void getActivities_allowsMember() {
        ProjectActivity activity = ProjectActivity.builder()
                .id(5L).project(project).actor(owner)
                .action(ProjectActivity.ActionType.TASK_CREATED)
                .message("João criou a tarefa x")
                .build();
        when(activityRepository.findByProjectIdOrderByCreatedAtDesc(10L)).thenReturn(List.of(activity));

        var result = activityService.getActivities(10L, 1L);

        assertEquals(1, result.size());
        assertEquals("João criou a tarefa x", result.get(0).getMessage());
        verify(accessService).requireMember(10L, 1L);
    }

    @Test
    void getActivities_deniesNonMember() {
        doThrow(new UnauthorizedException("nope")).when(accessService).requireMember(10L, 999L);

        assertThrows(UnauthorizedException.class, () -> activityService.getActivities(10L, 999L));
    }

    @Test
    void record_savesActivity() {
        activityService.record(project, owner, ProjectActivity.ActionType.PROJECT_ARCHIVED, "msg");

        verify(activityRepository).save(any(ProjectActivity.class));
    }
}