package com.taskflow.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class NotificationEvent extends ApplicationEvent {

    private final Long userId;
    private final String type;
    private final String message;
    private final Long referenceId;
    private final String referenceType;

    public NotificationEvent(Object source, Long userId, String type, String message,
                             Long referenceId, String referenceType) {
        super(source);
        this.userId = userId;
        this.type = type;
        this.message = message;
        this.referenceId = referenceId;
        this.referenceType = referenceType;
    }
}
