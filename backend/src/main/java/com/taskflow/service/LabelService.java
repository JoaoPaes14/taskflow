package com.taskflow.service;

import com.taskflow.dto.TaskLabelDTO;
import com.taskflow.dto.TaskLabelRequestDTO;
import com.taskflow.entity.Project;
import com.taskflow.entity.TaskLabel;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.exception.UnauthorizedException;
import com.taskflow.repository.ProjectRepository;
import com.taskflow.repository.TaskLabelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class LabelService {

    private final TaskLabelRepository labelRepository;
    private final ProjectRepository projectRepository;
    private final ProjectAccessService accessService;

    @Transactional(readOnly = true)
    @Cacheable(value = "labels", key = "#projectId")
    public List<TaskLabelDTO> getLabels(Long projectId, Long userId) {
        accessService.requireMember(projectId, userId);
        return labelRepository.findByProjectIdOrderByName(projectId).stream()
                .map(TaskLabelDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @CacheEvict(value = "labels", key = "#projectId")
    public TaskLabelDTO createLabel(Long projectId, TaskLabelRequestDTO request, Long userId) {
        accessService.requireMember(projectId, userId);
        Project project = projectRepository.findActiveById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (labelRepository.existsByProjectIdAndName(projectId, request.getName())) {
            throw new RuntimeException("A label with this name already exists in this project");
        }

        TaskLabel label = labelRepository.save(TaskLabel.builder()
                .project(project)
                .name(request.getName())
                .color(request.getColor())
                .build());

        return TaskLabelDTO.fromEntity(label);
    }

    @CacheEvict(value = "labels", allEntries = true)
    public void deleteLabel(Long labelId, Long userId) {
        TaskLabel label = labelRepository.findById(labelId)
                .orElseThrow(() -> new ResourceNotFoundException("Label not found"));
        accessService.requireMember(label.getProject().getId(), userId);
        labelRepository.delete(label);
    }
}
