package com.taskflow.controller;

import com.taskflow.dto.InviteMemberRequestDTO;
import com.taskflow.dto.ProjectMemberDTO;
import com.taskflow.dto.ProjectRequestDTO;
import com.taskflow.dto.ProjectResponseDTO;
import com.taskflow.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectResponseDTO> createProject(
            @Valid @RequestBody ProjectRequestDTO request,
            @RequestAttribute("userId") Long userId) {
        ProjectResponseDTO project = projectService.createProject(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(project);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponseDTO> getProjectById(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        ProjectResponseDTO project = projectService.getProjectById(id, userId);
        return ResponseEntity.ok(project);
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponseDTO>> getUserProjects(
            @RequestAttribute("userId") Long userId) {
        List<ProjectResponseDTO> projects = projectService.getProjectsByUser(userId);
        return ResponseEntity.ok(projects);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponseDTO> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectRequestDTO request,
            @RequestAttribute("userId") Long userId) {
        ProjectResponseDTO project = projectService.updateProject(id, request, userId);
        return ResponseEntity.ok(project);
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<ProjectResponseDTO> archiveProject(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        ProjectResponseDTO project = projectService.archiveProject(id, userId);
        return ResponseEntity.ok(project);
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<ProjectResponseDTO> restoreProject(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        ProjectResponseDTO project = projectService.restoreProject(id, userId);
        return ResponseEntity.ok(project);
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<ProjectMemberDTO>> getMembers(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        return ResponseEntity.ok(projectService.getMembers(id, userId));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ProjectMemberDTO> inviteMember(
            @PathVariable Long id,
            @Valid @RequestBody InviteMemberRequestDTO request,
            @RequestAttribute("userId") Long userId) {
        ProjectMemberDTO member = projectService.inviteMember(id, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(member);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        projectService.deleteProject(id, userId);
        return ResponseEntity.noContent().build();
    }
}