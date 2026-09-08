package com.taskflow.service;

import com.taskflow.dto.AttachmentDTO;
import com.taskflow.entity.Attachment;
import com.taskflow.entity.ProjectTask;
import com.taskflow.entity.User;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.repository.AttachmentRepository;
import com.taskflow.repository.ProjectTaskRepository;
import com.taskflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final ProjectTaskRepository taskRepository;
    private final UserRepository userRepository;

    @Value("${app.storage.upload-dir:./uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/png", "image/jpeg", "image/gif", "image/webp",
            "application/pdf",
            "text/plain", "text/csv",
            "application/zip",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    private static final long MAX_SIZE = 10 * 1024 * 1024; // 10MB

    public List<AttachmentDTO> getAttachments(Long taskId, Long userId) {
        return attachmentRepository.findByTaskIdOrderByCreatedAtDesc(taskId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public AttachmentDTO upload(Long taskId, MultipartFile file, Long userId) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("File exceeds 10MB limit");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("File type not allowed: " + file.getContentType());
        }

        ProjectTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String ext = getExtension(file.getOriginalFilename());
        String storedName = UUID.randomUUID() + (ext.isEmpty() ? "" : "." + ext);

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);
        Path filePath = uploadPath.resolve(storedName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        Attachment attachment = Attachment.builder()
                .task(task)
                .filename(storedName)
                .originalFilename(file.getOriginalFilename())
                .contentType(file.getContentType())
                .fileSize(file.getSize())
                .storagePath(filePath.toString())
                .uploadedBy(user)
                .build();

        return toDTO(attachmentRepository.save(attachment));
    }

    public void delete(Long attachmentId, Long userId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));

        Path path = Paths.get(attachment.getStoragePath());
        try {
            Files.deleteIfExists(path);
        } catch (IOException ignored) {}

        attachmentRepository.delete(attachment);
    }

    public AttachmentDTO download(Long attachmentId, Long userId) {
        return toDTO(findById(attachmentId));
    }

    public Path resolveStoragePath(Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));
        return Paths.get(attachment.getStoragePath());
    }

    public Attachment findById(Long attachmentId) {
        return attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));
    }

    private AttachmentDTO toDTO(Attachment a) {
        return AttachmentDTO.builder()
                .id(a.getId())
                .taskId(a.getTask().getId())
                .filename(a.getFilename())
                .originalFilename(a.getOriginalFilename())
                .contentType(a.getContentType())
                .fileSize(a.getFileSize())
                .uploadedById(a.getUploadedBy().getId())
                .uploadedByName(a.getUploadedBy().getName())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
