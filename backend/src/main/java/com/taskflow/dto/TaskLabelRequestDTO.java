package com.taskflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskLabelRequestDTO {

    @NotBlank(message = "Label name is required")
    @Size(max = 50, message = "Name must be at most 50 characters")
    private String name;

    @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "Color must be a valid hex color (e.g. #6366f1)")
    private String color = "#6366f1";
}
