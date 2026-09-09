package com.taskflow.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class CommentEvent extends ApplicationEvent {

    private final Long taskId;
    private final String eventType;
    private final Object data;

    public CommentEvent(Object source, Long taskId, String eventType, Object data) {
        super(source);
        this.taskId = taskId;
        this.eventType = eventType;
        this.data = data;
    }
}
