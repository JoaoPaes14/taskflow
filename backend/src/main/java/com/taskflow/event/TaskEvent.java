package com.taskflow.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class TaskEvent extends ApplicationEvent {

    private final Long projectId;
    private final String eventType;
    private final Object data;

    public TaskEvent(Object source, Long projectId, String eventType, Object data) {
        super(source);
        this.projectId = projectId;
        this.eventType = eventType;
        this.data = data;
    }
}
