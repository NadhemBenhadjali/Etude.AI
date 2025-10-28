package com.example.EtudeAI.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QAElement {
    
    @NotBlank(message = "Question cannot be blank")
    @Column(nullable = false)
    private String question;

    @NotBlank(message = "Answer cannot be blank")
    @Column(nullable = false)
    private String answer;
}
