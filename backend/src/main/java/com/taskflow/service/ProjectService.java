package com.taskflow.service;

import com.taskflow.dto.ProjectRequestDTO;
import com.taskflow.dto.ProjectResponseDTO;
import com.taskflow.entity.Project;
import com.taskflow.entity.ProjectMember;
import com.taskflow.entity.User;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.exception.UnauthorizedException;
import com.taskflow.repository.ProjectMemberRepository;
import com.taskflow.repository.ProjectRepository;
import com.taskflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    public ProjectResponseDTO createProject(ProjectRequestDTO request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .createdBy(user)
                .status(Project.ProjectStatus.ACTIVE)
                .build();

        Project saved = projectRepository.save(project);

        ProjectMember member = ProjectMember.builder()
                .project(saved)
                .user(user)
                .build();
        projectMemberRepository.save(member);

        return ProjectResponseDTO.fromEntity(saved);
    }

    public ProjectResponseDTO getProjectById(Long id, Long userId) {
        Project project = projectRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!isMemberOrOwner(id, userId)) {
            throw new UnauthorizedException("You don't have permission to access this project");
        }

        return ProjectResponseDTO.fromEntity(project);
    }

    public List<ProjectResponseDTO> getProjectsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Project> projects = projectRepository.findByMember(user);
        return projects.stream()
                .map(ProjectResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public ProjectResponseDTO updateProject(Long id, ProjectRequestDTO request, Long userId) {
        Project project = requireOwner(id, userId);

        project.setName(request.getName());
        project.setDescription(request.getDescription());

        Project updated = projectRepository.save(project);
        return ProjectResponseDTO.fromEntity(updated);
    }

    private boolean isMemberOrOwner(Long projectId, Long userId) {
        if (projectRepository.isUserMember(projectId, userId)) {
            return true;
        }
        return projectRepository.findById(projectId)
                .map(p -> p.getCreatedBy().getId().equals(userId))
                .orElse(false);
    }

    public void deleteProject(Long id, Long userId) {
        Project project = requireOwner(id, userId);
        project.setStatus(Project.ProjectStatus.DELETED);
        projectRepository.save(project);
    }

    public ProjectResponseDTO archiveProject(Long id, Long userId) {
        Project project = requireOwner(id, userId);
        project.setStatus(Project.ProjectStatus.ARCHIVED);
        return ProjectResponseDTO.fromEntity(projectRepository.save(project));
    }

    public ProjectResponseDTO restoreProject(Long id, Long userId) {
        Project project = requireOwner(id, userId);
        project.setStatus(Project.ProjectStatus.ACTIVE);
        return ProjectResponseDTO.fromEntity(projectRepository.save(project));
    }

    private Project requireOwner(Long id, Long userId) {
        Project project = projectRepository.findActiveById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!project.getCreatedBy().getId().equals(userId)) {
            throw new UnauthorizedException("You don't have permission to modify this project");
        }

        return project;
    }
}