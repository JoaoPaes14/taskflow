package com.taskflow.service;

import com.taskflow.config.JwtUtil;
import com.taskflow.dto.AuthResponseDTO;
import com.taskflow.dto.LoginRequestDTO;
import com.taskflow.dto.RegisterRequestDTO;
import com.taskflow.dto.UpdateProfileRequestDTO;
import com.taskflow.entity.Role;
import com.taskflow.entity.User;
import com.taskflow.exception.EmailAlreadyInUseException;
import com.taskflow.exception.InvalidCredentialsException;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .name("João")
                .email("j@j.com")
                .password("encoded")
                .role(Role.MEMBER)
                .build();
    }

    @Test
    void register_success() {
        RegisterRequestDTO req = new RegisterRequestDTO("João", "j@j.com", "password123");
        when(userRepository.existsByEmail("j@j.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtUtil.generateToken(1L, "j@j.com", "MEMBER")).thenReturn("token123");

        AuthResponseDTO result = authService.register(req);

        assertEquals("token123", result.getToken());
        assertEquals(1L, result.getUserId());
        assertEquals("João", result.getName());
        assertEquals("j@j.com", result.getEmail());
        assertEquals(Role.MEMBER, result.getRole());
    }

    @Test
    void register_duplicateEmail_throws() {
        RegisterRequestDTO req = new RegisterRequestDTO("João", "j@j.com", "password123");
        when(userRepository.existsByEmail("j@j.com")).thenReturn(true);

        assertThrows(EmailAlreadyInUseException.class, () -> authService.register(req));
    }

    @Test
    void login_success() {
        LoginRequestDTO req = new LoginRequestDTO("j@j.com", "password123");
        when(userRepository.findByEmail("j@j.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded")).thenReturn(true);
        when(jwtUtil.generateToken(1L, "j@j.com", "MEMBER")).thenReturn("token123");

        AuthResponseDTO result = authService.login(req);

        assertEquals("token123", result.getToken());
        assertEquals(1L, result.getUserId());
    }

    @Test
    void login_emailNotFound_throws() {
        LoginRequestDTO req = new LoginRequestDTO("no@no.com", "password123");
        when(userRepository.findByEmail("no@no.com")).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> authService.login(req));
    }

    @Test
    void login_wrongPassword_throws() {
        LoginRequestDTO req = new LoginRequestDTO("j@j.com", "wrong");
        when(userRepository.findByEmail("j@j.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> authService.login(req));
    }

    @Test
    void getProfile_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        AuthResponseDTO result = authService.getProfile(1L);

        assertEquals(1L, result.getUserId());
        assertEquals("João", result.getName());
        assertNull(result.getToken());
    }

    @Test
    void getProfile_notFound_throws() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.getProfile(999L));
    }

    @Test
    void updateProfile_success() {
        UpdateProfileRequestDTO req = new UpdateProfileRequestDTO("Novo Nome", "j@j.com", null, true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        AuthResponseDTO result = authService.updateProfile(1L, req);

        assertEquals("Novo Nome", result.getName());
        assertEquals("j@j.com", result.getEmail());
    }

    @Test
    void updateProfile_newEmailExists_throws() {
        UpdateProfileRequestDTO req = new UpdateProfileRequestDTO("João", "new@new.com", null, true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.existsByEmail("new@new.com")).thenReturn(true);

        assertThrows(EmailAlreadyInUseException.class, () -> authService.updateProfile(1L, req));
    }

    @Test
    void updateProfile_userNotFound_throws() {
        UpdateProfileRequestDTO req = new UpdateProfileRequestDTO("X", "x@x.com", null, null);
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.updateProfile(999L, req));
    }
}
