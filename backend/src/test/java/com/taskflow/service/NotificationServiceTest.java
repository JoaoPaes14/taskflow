package com.taskflow.service;

import com.taskflow.dto.NotificationDTO;
import com.taskflow.entity.Notification;
import com.taskflow.entity.User;
import com.taskflow.repository.NotificationRepository;
import com.taskflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private NotificationService notificationService;

    private User user;
    private Notification notification;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L).name("João").email("j@j.com").password("x").build();

        notification = Notification.builder()
                .id(100L)
                .user(user)
                .type("TASK_ASSIGNED")
                .message("You were assigned to a task")
                .referenceId(50L)
                .referenceType("TASK")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void send_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
            Notification n = inv.getArgument(0);
            n.setId(200L);
            return n;
        });

        notificationService.send(1L, "TASK_ASSIGNED", "You were assigned", 50L, "TASK");

        verify(notificationRepository).save(any(Notification.class));
        verify(eventPublisher).publishEvent(any());
    }

    @Test
    void send_userNotFound_doesNotSend() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        notificationService.send(999L, "TASK_ASSIGNED", "msg", 50L, "TASK");

        verify(notificationRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void getNotifications_success() {
        Page<Notification> page = new PageImpl<>(List.of(notification));
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L, PageRequest.of(0, 10)))
                .thenReturn(page);

        Page<NotificationDTO> result = notificationService.getNotifications(1L, 0, 10);

        assertEquals(1, result.getTotalElements());
        assertEquals("TASK_ASSIGNED", result.getContent().get(0).getType());
        assertEquals("You were assigned to a task", result.getContent().get(0).getMessage());
    }

    @Test
    void getNotifications_emptyPage() {
        Page<Notification> page = new PageImpl<>(List.of());
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L, PageRequest.of(0, 10)))
                .thenReturn(page);

        Page<NotificationDTO> result = notificationService.getNotifications(1L, 0, 10);

        assertEquals(0, result.getTotalElements());
    }

    @Test
    void getUnreadCount_returnsCount() {
        when(notificationRepository.countByUserIdAndReadFalse(1L)).thenReturn(3L);

        long result = notificationService.getUnreadCount(1L);

        assertEquals(3L, result);
    }

    @Test
    void getUnreadCount_zeroUnread() {
        when(notificationRepository.countByUserIdAndReadFalse(1L)).thenReturn(0L);

        long result = notificationService.getUnreadCount(1L);

        assertEquals(0L, result);
    }

    @Test
    void markAsRead_success() {
        assertDoesNotThrow(() -> notificationService.markAsRead(100L, 1L));
        verify(notificationRepository).markAsRead(100L, 1L);
    }

    @Test
    void markAllAsRead_success() {
        assertDoesNotThrow(() -> notificationService.markAllAsRead(1L));
        verify(notificationRepository).markAllAsRead(1L);
    }
}
