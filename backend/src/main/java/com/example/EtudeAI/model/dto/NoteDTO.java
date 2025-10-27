package com.example.EtudeAI.model.dto;

import java.util.Date;
import java.util.UUID;

public record NoteDTO(
        UUID id,
        UUID userId,
        String content,
        Date date,
        String subject,
        String module,
        String lesson
) {}
