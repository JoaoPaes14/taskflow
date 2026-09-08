package com.taskflow.controller;

import com.taskflow.dto.LoginRequestDTO;
import com.taskflow.dto.RegisterRequestDTO;
import com.taskflow.dto.UpdateProfileRequestDTO;
import com.taskflow.dto.AuthResponseDTO;
import com.taskflow.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(
            @Valid @RequestBody RegisterRequestDTO request) {
        AuthResponseDTO response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO request) {
        AuthResponseDTO response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponseDTO> me(
            @RequestAttribute("userId") Long userId) {
        AuthResponseDTO response = authService.getProfile(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<AuthResponseDTO> updateProfile(
            @RequestAttribute("userId") Long userId,
            @Valid @RequestBody UpdateProfileRequestDTO request) {
        AuthResponseDTO response = authService.updateProfile(userId, request);
        return ResponseEntity.ok(response);
    }
}
