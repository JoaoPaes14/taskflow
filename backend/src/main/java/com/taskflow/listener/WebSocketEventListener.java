package com.taskflow.listener;

import com.taskflow.dto.NotificationDTO;
import com.taskflow.event.CommentEvent;
import com.taskflow.event.NotificationEvent;
import com.taskflow.event.TaskEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleTaskEvent(TaskEvent event) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("event", event.getEventType());
        payload.put("data", event.getData());
        messagingTemplate.convertAndSend(
                "/topic/projects/" + event.getProjectId() + "/tasks",
                (Object) payload);
    }

    @EventListener
    public void handleCommentEvent(CommentEvent event) {
        if ("COMMENT_UPDATED".equals(event.getEventType()) || "COMMENT_DELETED".equals(event.getEventType())) {
            Map<String, Object> payload = new HashMap<>();
            payload.put("event", event.getEventType());
            payload.put("data", event.getData());
            messagingTemplate.convertAndSend(
                    "/topic/tasks/" + event.getTaskId() + "/comments",
                    (Object) payload);
        } else {
            messagingTemplate.convertAndSend(
                    "/topic/tasks/" + event.getTaskId() + "/comments",
                    event.getData());
        }
    }

    @EventListener
    public void handleNotificationEvent(NotificationEvent event) {
        messagingTemplate.convertAndSendToUser(
                event.getUserId().toString(),
                "/notifications",
                NotificationDTO.builder()
                        .id(event.getReferenceId())
                        .type(event.getType())
                        .message(event.getMessage())
                        .referenceId(event.getReferenceId())
                        .referenceType(event.getReferenceType())
                        .build());
    }
}
