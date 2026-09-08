package com.taskflow.scheduler;

import com.taskflow.entity.ProjectTask;
import com.taskflow.repository.ProjectTaskRepository;
import com.taskflow.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DueDateNotificationScheduler {

    private final ProjectTaskRepository taskRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 9 * * *")
    public void checkDueDates() {
        log.info("Running due date notification check...");
        LocalDate today = LocalDate.now();

        List<ProjectTask> tasksDueToday = taskRepository.findTasksDueOnDate(today);
        for (ProjectTask task : tasksDueToday) {
            if (task.getAssignee() != null) {
                notificationService.send(
                        task.getAssignee().getId(),
                        "DUE_DATE_TODAY",
                        "Tarefa \"" + task.getTitle() + "\" vence hoje!",
                        task.getId(),
                        "TASK"
                );
            }
        }

        List<ProjectTask> tasksDueTomorrow = taskRepository.findTasksDueOnDate(today.plusDays(1));
        for (ProjectTask task : tasksDueTomorrow) {
            if (task.getAssignee() != null) {
                notificationService.send(
                        task.getAssignee().getId(),
                        "DUE_DATE_TOMORROW",
                        "Tarefa \"" + task.getTitle() + "\" vence amanha!",
                        task.getId(),
                        "TASK"
                );
            }
        }

        List<ProjectTask> tasksOverdue = taskRepository.findTasksDueBetween(LocalDate.MIN, today.minusDays(1));
        Set<Long> notifiedUserIds = new HashSet<>();
        for (ProjectTask task : tasksOverdue) {
            if (task.getAssignee() != null && !notifiedUserIds.contains(task.getAssignee().getId())) {
                notificationService.send(
                        task.getAssignee().getId(),
                        "DUE_DATE_OVERDUE",
                        "Voce tem tarefas atrasadas!",
                        task.getId(),
                        "TASK"
                );
                notifiedUserIds.add(task.getAssignee().getId());
            }
        }

        log.info("Due date check complete. Today: {}, Tomorrow: {}, Overdue: {}",
                tasksDueToday.size(), tasksDueTomorrow.size(), tasksOverdue.size());
    }
}
