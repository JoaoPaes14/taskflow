package com.taskflow.service;

import com.taskflow.dto.PageResponseDTO;
import com.taskflow.dto.ProjectActivityDTO;
import com.taskflow.entity.Project;
import com.taskflow.entity.ProjectActivity;
import com.taskflow.entity.User;
import com.taskflow.repository.ProjectActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectActivityService {

    private final ProjectActivityRepository activityRepository;
    private final ProjectAccessService accessService;

    @Transactional(readOnly = true)
    public List<ProjectActivityDTO> getActivities(Long projectId, Long userId) {
        accessService.requireMember(projectId, userId);
        return activityRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(ProjectActivityDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponseDTO<ProjectActivityDTO> getActivitiesPaged(Long projectId, Long userId, int page, int size) {
        accessService.requireMember(projectId, userId);
        Pageable pageable = PageRequest.of(page, size);
        Page<ProjectActivity> result = activityRepository.findByProjectIdOrderByCreatedAtDescPaged(projectId, pageable);
        List<ProjectActivityDTO> content = result.getContent().stream()
                .map(ProjectActivityDTO::fromEntity)
                .collect(Collectors.toList());
        return PageResponseDTO.of(content, page, size, result.getTotalElements());
    }

    @Transactional
    public void record(Project project, User actor, ProjectActivity.ActionType action, String message) {
        activityRepository.save(ProjectActivity.builder()
                .project(project)
                .actor(actor)
                .action(action)
                .message(message)
                .build());
    }
}
