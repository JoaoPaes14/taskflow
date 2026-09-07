package com.taskflow.service;

import com.taskflow.exception.UnauthorizedException;
import com.taskflow.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProjectAccessService {

    private final ProjectRepository projectRepository;

    public boolean isMember(Long projectId, Long userId) {
        return projectRepository.isUserMember(projectId, userId)
                || projectRepository.findById(projectId)
                        .map(p -> p.getCreatedBy().getId().equals(userId))
                        .orElse(false);
    }

    public void requireMember(Long projectId, Long userId) {
        if (!isMember(projectId, userId)) {
            throw new UnauthorizedException("You don't have permission to access this project");
        }
    }
}