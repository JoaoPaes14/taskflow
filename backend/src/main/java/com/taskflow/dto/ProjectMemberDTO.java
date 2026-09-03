package com.taskflow.dto;

import com.taskflow.entity.ProjectMember;
import com.taskflow.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectMemberDTO {

    private Long id;
    private Long userId;
    private String name;
    private String email;
    private Role role;
    private LocalDateTime joinedAt;

    public static ProjectMemberDTO fromEntity(ProjectMember member) {
        return ProjectMemberDTO.builder()
                .id(member.getId())
                .userId(member.getUser().getId())
                .name(member.getUser().getName())
                .email(member.getUser().getEmail())
                .role(member.getUser().getRole())
                .joinedAt(member.getJoinedAt())
                .build();
    }
}
