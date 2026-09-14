package com.taskflow.service;

import com.taskflow.dto.SubtaskDTO;
import com.taskflow.dto.SubtaskRequestDTO;
import com.taskflow.entity.Project;
import com.taskflow.entity.ProjectTask;
import com.taskflow.entity.Role;
import com.taskflow.entity.Subtask;
import com.taskflow.entity.User;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.repository.ProjectTaskRepository;
import com.taskflow.repository.SubtaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubtaskServiceTest {

    @Mock
    private SubtaskRepository subtaskRepository;
    @Mock
    private ProjectTaskRepository taskRepository;
    @Mock
    private ProjectAccessService accessService;

    @InjectMocks
    private SubtaskService subtaskService;

    private ProjectTask task;
    private Project project;
    private User user;
    private Subtask subtask;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L).name("João").email("j@j.com").password("x").role(Role.MEMBER).build();

        project = Project.builder()
                .id(10L).name("Site").createdBy(user).build();

        task = ProjectTask.builder()
                .id(50L).title("Task 1").project(project).createdBy(user).position(0).build();

        subtask = Subtask.builder()
                .id(100L).title("Sub 1").completed(false).position(0).task(task).build();
    }

    @Test
    void getSubtasks_success() {
        when(taskRepository.findById(50L)).thenReturn(Optional.of(task));
        when(subtaskRepository.findByTaskIdOrderByPositionAsc(50L)).thenReturn(List.of(subtask));

        List<SubtaskDTO> result = subtaskService.getSubtasks(50L, 1L);

        assertEquals(1, result.size());
        assertEquals("Sub 1", result.get(0).getTitle());
        assertEquals(50L, result.get(0).getTaskId());
    }

    @Test
    void getSubtasks_taskNotFound_throws() {
        when(taskRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> subtaskService.getSubtasks(999L, 1L));
    }

    @Test
    void createSubtask_success() {
        SubtaskRequestDTO req = new SubtaskRequestDTO("New Sub");
        when(taskRepository.findById(50L)).thenReturn(Optional.of(task));
        when(subtaskRepository.countByTaskId(50L)).thenReturn(1L);
        when(subtaskRepository.save(any(Subtask.class))).thenAnswer(invocation -> {
            Subtask s = invocation.getArgument(0);
            s.setId(200L);
            return s;
        });

        SubtaskDTO result = subtaskService.createSubtask(50L, req, 1L);

        assertEquals(200L, result.getId());
        assertEquals("New Sub", result.getTitle());
        assertFalse(result.getCompleted());
        assertEquals(1, result.getPosition());
    }

    @Test
    void createSubtask_taskNotFound_throws() {
        when(taskRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> subtaskService.createSubtask(999L, new SubtaskRequestDTO("X"), 1L));
    }

    @Test
    void toggleSubtask_success() {
        when(subtaskRepository.findById(100L)).thenReturn(Optional.of(subtask));
        when(subtaskRepository.save(any(Subtask.class))).thenAnswer(i -> i.getArgument(0));

        SubtaskDTO result = subtaskService.toggleSubtask(100L, 1L);

        assertTrue(result.getCompleted());
    }

    @Test
    void toggleSubtask_alreadyCompleted_becomesIncomplete() {
        subtask.setCompleted(true);
        when(subtaskRepository.findById(100L)).thenReturn(Optional.of(subtask));
        when(subtaskRepository.save(any(Subtask.class))).thenAnswer(i -> i.getArgument(0));

        SubtaskDTO result = subtaskService.toggleSubtask(100L, 1L);

        assertFalse(result.getCompleted());
    }

    @Test
    void toggleSubtask_notFound_throws() {
        when(subtaskRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> subtaskService.toggleSubtask(999L, 1L));
    }

    @Test
    void deleteSubtask_success() {
        when(subtaskRepository.findById(100L)).thenReturn(Optional.of(subtask));

        assertDoesNotThrow(() -> subtaskService.deleteSubtask(100L, 1L));
        verify(subtaskRepository).delete(subtask);
    }

    @Test
    void deleteSubtask_notFound_throws() {
        when(subtaskRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> subtaskService.deleteSubtask(999L, 1L));
    }

    @Test
    void deleteSubtask_deniesNonMember() {
        when(subtaskRepository.findById(100L)).thenReturn(Optional.of(subtask));
        doThrow(new com.taskflow.exception.UnauthorizedException("No access"))
                .when(accessService).requireMember(10L, 999L);

        assertThrows(com.taskflow.exception.UnauthorizedException.class,
                () -> subtaskService.deleteSubtask(100L, 999L));
    }
}
