package com.taskflow.controller;

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
    public ResponseEntity<List<ProjectActivityDTO>> getActivities(
            @PathVariable Long projectId,
            @RequestAttribute("userId") Long userId) {
        return ResponseEntity.ok(activityService.getActivities(projectId, userId));
    }
}