package com.taskflow.service;

import com.taskflow.dto.TaskLabelDTO;
import com.taskflow.dto.TaskLabelRequestDTO;
import com.taskflow.entity.Project;
import com.taskflow.entity.TaskLabel;
import com.taskflow.entity.User;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.repository.ProjectRepository;
import com.taskflow.repository.TaskLabelRepository;
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
class LabelServiceTest {

    @Mock
    private TaskLabelRepository labelRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectAccessService accessService;

    @InjectMocks
    private LabelService labelService;

    private Project project;
    private User user;
    private TaskLabel label;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L).name("João").email("j@j.com").password("x").build();

        project = Project.builder()
                .id(10L).name("Site").createdBy(user).build();

        label = TaskLabel.builder()
                .id(20L).project(project).name("Bug").color("#ff0000").build();
    }

    @Test
    void getLabels_success() {
        when(labelRepository.findByProjectIdOrderByName(10L)).thenReturn(List.of(label));

        List<TaskLabelDTO> result = labelService.getLabels(10L, 1L);

        assertEquals(1, result.size());
        assertEquals("Bug", result.get(0).getName());
        assertEquals(10L, result.get(0).getProjectId());
    }

    @Test
    void createLabel_success() {
        TaskLabelRequestDTO req = new TaskLabelRequestDTO("Feature", "#00ff00");
        when(projectRepository.findActiveById(10L)).thenReturn(Optional.of(project));
        when(labelRepository.existsByProjectIdAndName(10L, "Feature")).thenReturn(false);
        when(labelRepository.save(any(TaskLabel.class))).thenAnswer(invocation -> {
            TaskLabel l = invocation.getArgument(0);
            l.setId(30L);
            return l;
        });

        TaskLabelDTO result = labelService.createLabel(10L, req, 1L);

        assertEquals(30L, result.getId());
        assertEquals("Feature", result.getName());
        assertEquals("#00ff00", result.getColor());
    }

    @Test
    void createLabel_duplicateName_throws() {
        TaskLabelRequestDTO req = new TaskLabelRequestDTO("Bug", "#ff0000");
        when(projectRepository.findActiveById(10L)).thenReturn(Optional.of(project));
        when(labelRepository.existsByProjectIdAndName(10L, "Bug")).thenReturn(true);

        assertThrows(RuntimeException.class, () -> labelService.createLabel(10L, req, 1L));
    }

    @Test
    void createLabel_projectNotFound_throws() {
        when(projectRepository.findActiveById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> labelService.createLabel(999L, new TaskLabelRequestDTO("X", "#000000"), 1L));
    }

    @Test
    void updateLabel_success() {
        TaskLabelRequestDTO req = new TaskLabelRequestDTO("Fixed", "#0000ff");
        when(labelRepository.findById(20L)).thenReturn(Optional.of(label));
        when(labelRepository.save(any(TaskLabel.class))).thenAnswer(i -> i.getArgument(0));

        TaskLabelDTO result = labelService.updateLabel(20L, req, 1L);

        assertEquals("Fixed", result.getName());
        assertEquals("#0000ff", result.getColor());
    }

    @Test
    void updateLabel_notFound_throws() {
        when(labelRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> labelService.updateLabel(999L, new TaskLabelRequestDTO("X", "#000000"), 1L));
    }

    @Test
    void deleteLabel_success() {
        when(labelRepository.findById(20L)).thenReturn(Optional.of(label));

        assertDoesNotThrow(() -> labelService.deleteLabel(20L, 1L));
        verify(labelRepository).delete(label);
    }

    @Test
    void deleteLabel_notFound_throws() {
        when(labelRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> labelService.deleteLabel(999L, 1L));
    }

    @Test
    void deleteLabel_deniesNonMember() {
        when(labelRepository.findById(20L)).thenReturn(Optional.of(label));
        doThrow(new com.taskflow.exception.UnauthorizedException("No access"))
                .when(accessService).requireMember(10L, 999L);

        assertThrows(com.taskflow.exception.UnauthorizedException.class,
                () -> labelService.deleteLabel(20L, 999L));
    }
}
