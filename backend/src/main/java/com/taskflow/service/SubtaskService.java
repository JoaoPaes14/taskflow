package com.taskflow.service;

import com.taskflow.dto.SubtaskDTO;
import com.taskflow.dto.SubtaskRequestDTO;
import com.taskflow.entity.ProjectTask;
import com.taskflow.entity.Subtask;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.repository.ProjectTaskRepository;
import com.taskflow.repository.SubtaskRepository;
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
public class SubtaskService {

    private final SubtaskRepository subtaskRepository;
    private final ProjectTaskRepository taskRepository;
    private final ProjectAccessService accessService;

    @Transactional(readOnly = true)
    @Cacheable(value = "subtasks", key = "#taskId")
    public List<SubtaskDTO> getSubtasks(Long taskId, Long userId) {
        ProjectTask task = getTask(taskId);
        accessService.requireMember(task.getProject().getId(), userId);
        return subtaskRepository.findByTaskIdOrderByPositionAsc(taskId).stream()
                .map(SubtaskDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @CacheEvict(value = "subtasks", key = "#taskId")
    public SubtaskDTO createSubtask(Long taskId, SubtaskRequestDTO request, Long userId) {
        ProjectTask task = getTask(taskId);
        accessService.requireMember(task.getProject().getId(), userId);

        int position = (int) subtaskRepository.countByTaskId(taskId);

        Subtask subtask = subtaskRepository.save(Subtask.builder()
                .title(request.getTitle())
                .completed(false)
                .position(position)
                .task(task)
                .build());

        return SubtaskDTO.fromEntity(subtask);
    }

    @CacheEvict(value = "subtasks", allEntries = true)
    public SubtaskDTO toggleSubtask(Long subtaskId, Long userId) {
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found"));
        accessService.requireMember(subtask.getTask().getProject().getId(), userId);

        subtask.setCompleted(!subtask.getCompleted());
        return SubtaskDTO.fromEntity(subtaskRepository.save(subtask));
    }

    @CacheEvict(value = "subtasks", allEntries = true)
    public void deleteSubtask(Long subtaskId, Long userId) {
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found"));
        accessService.requireMember(subtask.getTask().getProject().getId(), userId);
        subtaskRepository.delete(subtask);
    }

    private ProjectTask getTask(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }
}
