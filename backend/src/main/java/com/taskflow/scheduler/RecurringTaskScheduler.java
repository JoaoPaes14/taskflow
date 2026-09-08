package com.taskflow.scheduler;

import com.taskflow.entity.ProjectTask;
import com.taskflow.repository.ProjectTaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecurringTaskScheduler {

    private final ProjectTaskRepository taskRepository;

    @Scheduled(cron = "0 0 2 * * *")
    public void createRecurringTasks() {
        log.info("Running recurring task check...");
        LocalDate today = LocalDate.now();

        List<ProjectTask> recurringTasks = taskRepository.findCompletedRecurringTasks(today);

        for (ProjectTask task : recurringTasks) {
            LocalDate nextDate = calculateNextDate(task.getDueDate(), task.getRecurrence());
            if (nextDate == null) continue;

            ProjectTask newTask = ProjectTask.builder()
                    .title(task.getTitle())
                    .description(task.getDescription())
                    .status(ProjectTask.TaskStatus.TODO)
                    .priority(task.getPriority())
                    .dueDate(nextDate)
                    .recurrence(task.getRecurrence())
                    .nextRecurrenceDate(nextDate)
                    .position((int) taskRepository.countByProjectIdAndStatusAndArchived(
                            task.getProject().getId(), ProjectTask.TaskStatus.TODO, false))
                    .project(task.getProject())
                    .assignee(task.getAssignee())
                    .createdBy(task.getCreatedBy())
                    .build();

            taskRepository.save(newTask);
            log.info("Created recurring task '{}' for {}", newTask.getTitle(), nextDate);
        }

        log.info("Recurring task check complete. Processed {} tasks.", recurringTasks.size());
    }

    private LocalDate calculateNextDate(LocalDate currentDueDate, ProjectTask.TaskRecurrence recurrence) {
        if (currentDueDate == null || recurrence == null || recurrence == ProjectTask.TaskRecurrence.NONE) {
            return null;
        }
        return switch (recurrence) {
            case DAILY -> currentDueDate.plusDays(1);
            case WEEKLY -> currentDueDate.plusWeeks(1);
            case MONTHLY -> currentDueDate.plusMonths(1);
            default -> null;
        };
    }
}
