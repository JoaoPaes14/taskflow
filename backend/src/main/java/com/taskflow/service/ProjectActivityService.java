package com.taskflow.service;

import com.taskflow.dto.ProjectActivityDTO;
import com.taskflow.entity.Project;
import com.taskflow.entity.ProjectActivity;
import com.taskflow.entity.User;
import com.taskflow.repository.ProjectActivityRepository;
import lombok.RequiredArgsConstructor;
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