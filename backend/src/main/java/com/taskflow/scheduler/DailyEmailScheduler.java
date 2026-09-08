package com.taskflow.scheduler;

import com.taskflow.entity.ProjectTask;
import com.taskflow.entity.User;
import com.taskflow.repository.ProjectTaskRepository;
import com.taskflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DailyEmailScheduler {

    private final ProjectTaskRepository taskRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Scheduled(cron = "0 0 8 * * *")
    public void sendDailySummary() {
        log.info("Running daily email summary...");
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);

        List<User> users = userRepository.findAll();
        for (User user : users) {
            if (!user.getEmailNotifications()) continue;

            List<ProjectTask> todayTasks = taskRepository.findTasksDueOnDate(today);
            List<ProjectTask> tomorrowTasks = taskRepository.findTasksDueOnDate(tomorrow);
            List<ProjectTask> overdueTasks = taskRepository.findTasksDueBetween(LocalDate.MIN, today.minusDays(1));

            long userOverdue = overdueTasks.stream()
                    .filter(t -> t.getAssignee() != null && t.getAssignee().getId().equals(user.getId()))
                    .count();
            long userToday = todayTasks.stream()
                    .filter(t -> t.getAssignee() != null && t.getAssignee().getId().equals(user.getId()))
                    .count();
            long userTomorrow = tomorrowTasks.stream()
                    .filter(t -> t.getAssignee() != null && t.getAssignee().getId().equals(user.getId()))
                    .count();

            if (userOverdue == 0 && userToday == 0 && userTomorrow == 0) continue;

            String subject = "TaskFlow - Resumo diario";
            String body = String.format(
                    "Ola %s,\n\n" +
                    "Resumo das suas tarefas:\n" +
                    "- Atrasadas: %d\n" +
                    "- Vencendo hoje: %d\n" +
                    "- Vencendo amanha: %d\n\n" +
                    "Acesse o TaskFlow para mais detalhes.",
                    user.getName(), userOverdue, userToday, userTomorrow);

            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(user.getEmail());
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
                log.info("Daily summary sent to {}", user.getEmail());
            } catch (Exception e) {
                log.warn("Failed to send email to {}: {}", user.getEmail(), e.getMessage());
            }
        }
        log.info("Daily email summary complete.");
    }
}
