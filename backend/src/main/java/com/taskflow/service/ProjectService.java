package com.taskflow.service;

import com.taskflow.dto.InviteMemberRequestDTO;
import com.taskflow.dto.ProjectMemberDTO;
import com.taskflow.dto.ProjectRequestDTO;
import com.taskflow.dto.ProjectResponseDTO;
import com.taskflow.entity.Project;
import com.taskflow.entity.ProjectActivity;
import com.taskflow.entity.ProjectMember;
import com.taskflow.entity.ProjectRole;
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
    private final ProjectActivityService activityService;

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
                .role(ProjectRole.OWNER)
                .build();
        projectMemberRepository.save(member);

        activityService.record(saved, user, ProjectActivity.ActionType.PROJECT_CREATED,
                user.getName() + " criou o projeto \"" + saved.getName() + "\"");

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

    public List<ProjectMemberDTO> getMembers(Long projectId, Long userId) {
        requireAccess(projectId, userId);
        return projectMemberRepository.findByProjectId(projectId).stream()
                .map(ProjectMemberDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public ProjectMemberDTO inviteMember(Long projectId, InviteMemberRequestDTO request, Long userId) {
        requireOwner(projectId, userId);

        User member = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No user is registered with the email " + request.getEmail()));

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, member.getId())) {
            throw new IllegalArgumentException("This user is already a member of the project");
        }

        Project project = projectRepository.findActiveById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        ProjectMember saved = projectMemberRepository.save(ProjectMember.builder()
                .project(project)
                .user(member)
                .build());

        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        activityService.record(project, owner, ProjectActivity.ActionType.MEMBER_INVITED,
                owner.getName() + " convidou " + member.getName() + " para o projeto");

        return ProjectMemberDTO.fromEntity(saved);
    }

    public void removeMember(Long projectId, Long targetUserId, Long userId) {
        Project project = projectRepository.findActiveById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        boolean isOwner = project.getCreatedBy().getId().equals(userId);
        boolean removingSelf = userId.equals(targetUserId);

        if (!isOwner && !removingSelf) {
            throw new UnauthorizedException("Only the project owner can remove members");
        }
        if (removingSelf && project.getCreatedBy().getId().equals(targetUserId)) {
            throw new IllegalArgumentException("The project owner cannot leave the project");
        }

        ProjectMember membership = projectMemberRepository.findByProjectIdAndUserId(projectId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("This user is not a member of the project"));

        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String message = removingSelf
                ? actor.getName() + " saiu do projeto"
                : actor.getName() + " removeu " + membership.getUser().getName() + " do projeto";

        projectMemberRepository.delete(membership);
        activityService.record(project, actor, ProjectActivity.ActionType.MEMBER_REMOVED, message);
    }

    private void requireAccess(Long projectId, Long userId) {
        if (!isMemberOrOwner(projectId, userId)) {
            throw new UnauthorizedException("You don't have permission to access this project");
        }
    }

    public void deleteProject(Long id, Long userId) {
        Project project = requireOwner(id, userId);
        project.setStatus(Project.ProjectStatus.DELETED);
        projectRepository.save(project);
    }

    public ProjectResponseDTO archiveProject(Long id, Long userId) {
        Project project = requireOwner(id, userId);
        project.setStatus(Project.ProjectStatus.ARCHIVED);
        ProjectResponseDTO dto = ProjectResponseDTO.fromEntity(projectRepository.save(project));

        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        activityService.record(project, actor, ProjectActivity.ActionType.PROJECT_ARCHIVED,
                actor.getName() + " arquivou o projeto \"" + project.getName() + "\"");

        return dto;
    }

    public ProjectResponseDTO restoreProject(Long id, Long userId) {
        Project project = requireOwner(id, userId);
        project.setStatus(Project.ProjectStatus.ACTIVE);
        ProjectResponseDTO dto = ProjectResponseDTO.fromEntity(projectRepository.save(project));

        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        activityService.record(project, actor, ProjectActivity.ActionType.PROJECT_RESTORED,
                actor.getName() + " restaurou o projeto \"" + project.getName() + "\"");

        return dto;
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