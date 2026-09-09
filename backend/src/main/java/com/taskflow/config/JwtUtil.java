package com.taskflow.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    private static final int MIN_SECRET_LENGTH = 32;

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    private SecretKey cachedKey;

    @PostConstruct
    void validateSecret() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET environment variable is required. Generate one with: openssl rand -base64 48");
        }
        if (secret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException(
                    "JWT_SECRET must be at least " + MIN_SECRET_LENGTH + " characters. Current: " + secret.length());
        }
        if (secret.contains("mude-esta-chave")) {
            throw new IllegalStateException(
                    "JWT_SECRET is set to a known default. Generate a strong secret: openssl rand -base64 48");
        }
    }

    private SecretKey getSigningKey() {
        if (cachedKey == null) {
            byte[] keyBytes;
            try {
                keyBytes = Decoders.BASE64.decode(secret);
            } catch (Exception e) {
                keyBytes = secret.getBytes();
            }
            if (keyBytes.length < 32) {
                throw new IllegalStateException(
                        "JWT signing key must be at least 256 bits (32 bytes). Current key is " + keyBytes.length + " bytes.");
            }
            cachedKey = Keys.hmacShaKeyFor(keyBytes);
        }
        return cachedKey;
    }

    public String generateToken(Long userId, String email, String role) {
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public Claims extractAll(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long extractUserId(String token) {
        return Long.parseLong(extractAll(token).getSubject());
    }

    public String extractEmail(String token) {
        return extractAll(token).get("email", String.class);
    }

    public String extractRole(String token) {
        return extractAll(token).get("role", String.class);
    }

    public boolean isValid(String token) {
        try {
            return !extractAll(token).getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}
