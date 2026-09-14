package com.taskflow.service;

import com.taskflow.dto.AttachmentDTO;
import com.taskflow.entity.Attachment;
import com.taskflow.entity.Project;
import com.taskflow.entity.ProjectTask;
import com.taskflow.entity.User;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.repository.AttachmentRepository;
import com.taskflow.repository.ProjectTaskRepository;
import com.taskflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.File;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttachmentServiceTest {

    @Mock
    private AttachmentRepository attachmentRepository;
    @Mock
    private ProjectTaskRepository taskRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AttachmentService attachmentService;

    private ProjectTask task;
    private User user;
    private Attachment attachment;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L).name("João").email("j@j.com").password("x").build();

        Project project = Project.builder()
                .id(10L).name("Site").createdBy(user).build();

        task = ProjectTask.builder()
                .id(50L).title("Task 1").project(project).createdBy(user).position(0).build();

        attachment = Attachment.builder()
                .id(200L)
                .task(task)
                .filename("abc123.pdf")
                .originalFilename("doc.pdf")
                .contentType("application/pdf")
                .fileSize(1024L)
                .storagePath("/uploads/abc123.pdf")
                .uploadedBy(user)
                .build();

        ReflectionTestUtils.setField(attachmentService, "uploadDir", "./uploads");

        String uploadPath = java.nio.file.Paths.get("./uploads").toAbsolutePath().normalize().toString();
        attachment.setStoragePath(uploadPath + File.separator + "abc123.pdf");
    }

    @Test
    void getAttachments_success() {
        when(attachmentRepository.findByTaskIdOrderByCreatedAtDesc(50L)).thenReturn(List.of(attachment));

        List<AttachmentDTO> result = attachmentService.getAttachments(50L, 1L);

        assertEquals(1, result.size());
        assertEquals("doc.pdf", result.get(0).getOriginalFilename());
        assertEquals(1L, result.get(0).getUploadedById());
        assertEquals(50L, result.get(0).getTaskId());
    }

    @Test
    void getAttachments_emptyList() {
        when(attachmentRepository.findByTaskIdOrderByCreatedAtDesc(50L)).thenReturn(List.of());

        List<AttachmentDTO> result = attachmentService.getAttachments(50L, 1L);

        assertTrue(result.isEmpty());
    }

    @Test
    void delete_success() {
        when(attachmentRepository.findById(200L)).thenReturn(Optional.of(attachment));

        assertDoesNotThrow(() -> attachmentService.delete(200L, 1L));
        verify(attachmentRepository).delete(attachment);
    }

    @Test
    void delete_notFound_throws() {
        when(attachmentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> attachmentService.delete(999L, 1L));
    }

    @Test
    void download_success() {
        when(attachmentRepository.findById(200L)).thenReturn(Optional.of(attachment));

        AttachmentDTO result = attachmentService.download(200L, 1L);

        assertEquals(200L, result.getId());
        assertEquals("abc123.pdf", result.getFilename());
        assertEquals("doc.pdf", result.getOriginalFilename());
    }

    @Test
    void download_notFound_throws() {
        when(attachmentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> attachmentService.download(999L, 1L));
    }

    @Test
    void findById_success() {
        when(attachmentRepository.findById(200L)).thenReturn(Optional.of(attachment));

        Attachment result = attachmentService.findById(200L);

        assertEquals(200L, result.getId());
    }

    @Test
    void findById_notFound_throws() {
        when(attachmentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> attachmentService.findById(999L));
    }

    @Test
    void resolveStoragePath_success() {
        when(attachmentRepository.findById(200L)).thenReturn(Optional.of(attachment));

        var path = attachmentService.resolveStoragePath(200L);

        assertEquals("abc123.pdf", path.getFileName().toString());
    }

    @Test
    void resolveStoragePath_notFound_throws() {
        when(attachmentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> attachmentService.resolveStoragePath(999L));
    }
}
