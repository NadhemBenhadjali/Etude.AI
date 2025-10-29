package com.example.EtudeAI.model.dto;

import com.example.EtudeAI.model.enums.Level;
import com.example.EtudeAI.model.enums.NoteType;

import java.time.ZonedDateTime;
import java.util.UUID;

public record NoteDTO(
        UUID id,
        NoteType noteType,
        String content,
        ZonedDateTime date,
        Level level,
        String subject,
        String module,
        String lesson
) {}
