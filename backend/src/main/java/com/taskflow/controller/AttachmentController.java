package com.taskflow.controller;

import com.taskflow.dto.AttachmentDTO;
import com.taskflow.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    @GetMapping("/tasks/{taskId}/attachments")
    public ResponseEntity<List<AttachmentDTO>> getAttachments(
            @PathVariable Long taskId,
            @RequestAttribute("userId") Long userId) {
        return ResponseEntity.ok(attachmentService.getAttachments(taskId, userId));
    }

    @PostMapping("/tasks/{taskId}/attachments")
    public ResponseEntity<AttachmentDTO> upload(
            @PathVariable Long taskId,
            @RequestParam("file") MultipartFile file,
            @RequestAttribute("userId") Long userId) throws IOException {
        return ResponseEntity.status(201).body(attachmentService.upload(taskId, file, userId));
    }

    @GetMapping("/attachments/{id}/download")
    public ResponseEntity<Resource> download(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) throws MalformedURLException {
        AttachmentDTO dto = attachmentService.download(id, userId);
        Path filePath = attachmentService.resolveStoragePath(id);
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(dto.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        sanitizeContentDisposition(dto.getOriginalFilename()))
                .body(resource);
    }

    @DeleteMapping("/attachments/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        attachmentService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    private String sanitizeContentDisposition(String originalFilename) {
        String name = originalFilename != null ? originalFilename : "arquivo";
        String ascii = name.replaceAll("[\\r\\n\\\"]", "_");
        return "attachment; filename=\"" + ascii + "\"; filename*=UTF-8''"
                + URLEncoder.encode(name, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
