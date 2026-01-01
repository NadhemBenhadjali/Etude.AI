package com.example.EtudeAI.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementDTO {
    private UUID id;
    private String name;
    private String description;
    private String icon;
    private boolean unlocked;
    private ZonedDateTime unlockedAt;
    private Integer progress;        // Progress percentage (0-100)
    private Integer currentValue;    // Current user value (e.g., current quiz count)
    private Integer targetValue;     // Target value to unlock (e.g., required quiz count)
}
