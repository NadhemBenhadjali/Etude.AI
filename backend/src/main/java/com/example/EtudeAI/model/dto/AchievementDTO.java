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
}
