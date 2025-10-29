package com.example.EtudeAI.model.dto;

import java.util.UUID;

public record QnAElementDTO(
        UUID id,
        String question,
        String answer
) {}
