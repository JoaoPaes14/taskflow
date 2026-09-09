package com.taskflow.service;

import com.taskflow.dto.TaskCommentRequestDTO;
import com.taskflow.entity.Project;
import com.taskflow.entity.ProjectActivity;
import com.taskflow.entity.ProjectTask;
import com.taskflow.entity.Role;
import com.taskflow.entity.TaskComment;
import com.taskflow.entity.User;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.exception.UnauthorizedException;
import com.taskflow.repository.ProjectTaskRepository;
import com.taskflow.repository.TaskCommentRepository;
import com.taskflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskCommentServiceTest {

    @Mock
    private TaskCommentRepository commentRepository;
    @Mock
    private ProjectTaskRepository taskRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProjectAccessService accessService;
    @Mock
    private ProjectActivityService activityService;
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private TaskCommentService commentService;

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
                .id(100L).title("Tarefa 1")
                .status(ProjectTask.TaskStatus.TODO)
                .position(0)
                .project(project)
                .createdBy(owner)
                .build();
    }

    @Test
    void getComments_allowsMember() {
        TaskComment comment = TaskComment.builder().id(1L).task(task).author(owner).content("oi").build();
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        when(commentRepository.findByTaskIdOrderByCreatedAtAsc(100L)).thenReturn(List.of(comment));

        var result = commentService.getComments(100L, 1L);

        assertEquals(1, result.size());
        assertEquals("oi", result.get(0).getContent());
        verify(accessService).requireMember(10L, 1L);
    }

    @Test
    void getComments_deniesNonMember() {
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        doThrow(new UnauthorizedException("nope")).when(accessService).requireMember(10L, 999L);

        assertThrows(UnauthorizedException.class, () -> commentService.getComments(100L, 999L));
    }

    @Test
    void getComments_throwsNotFoundWhenTaskMissing() {
        when(taskRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> commentService.getComments(999L, 1L));
    }

    @Test
    void addComment_recordsActivityAndReturnsComment() {
        TaskCommentRequestDTO req = new TaskCommentRequestDTO("Comentario legal");
        TaskComment saved = TaskComment.builder().id(1L).task(task).author(owner).content("Comentario legal").build();

        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(commentRepository.save(any(TaskComment.class))).thenReturn(saved);

        var result = commentService.addComment(100L, req, 1L);

        assertEquals("Comentario legal", result.getContent());
        assertEquals("João", result.getAuthorName());
        verify(activityService).record(any(Project.class), any(User.class),
                eq(ProjectActivity.ActionType.COMMENT_ADDED), any(String.class));
    }

    @Test
    void addComment_deniesNonMember() {
        TaskCommentRequestDTO req = new TaskCommentRequestDTO("oi");
        when(taskRepository.findById(100L)).thenReturn(Optional.of(task));
        doThrow(new UnauthorizedException("nope")).when(accessService).requireMember(10L, 999L);

        assertThrows(UnauthorizedException.class, () -> commentService.addComment(100L, req, 999L));
    }
}