package com.example.EtudeAI.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Embeddable
public class QAElement {

    @NotBlank
    @Column(name = "question", nullable = false)
    private String question;

    @NotBlank
    @Column(name = "answer", nullable = false)
    private String answer;
}
