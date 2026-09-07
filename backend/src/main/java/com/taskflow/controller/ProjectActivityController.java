package com.taskflow.controller;

import com.taskflow.dto.PageResponseDTO;
import com.taskflow.dto.ProjectActivityDTO;
import com.taskflow.service.ProjectActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/activities")
@RequiredArgsConstructor
public class ProjectActivityController {

    private final ProjectActivityService activityService;

    @GetMapping
    public ResponseEntity<?> getActivities(
            @PathVariable Long projectId,
            @RequestAttribute("userId") Long userId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null && size != null) {
            PageResponseDTO<ProjectActivityDTO> result = activityService.getActivitiesPaged(projectId, userId, page, size);
            return ResponseEntity.ok(result);
        }
        List<ProjectActivityDTO> activities = activityService.getActivities(projectId, userId);
        return ResponseEntity.ok(activities);
    }
}
