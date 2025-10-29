package com.example.EtudeAI.model.entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "qna_element")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QnAElement {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;
    
    @NotBlank
    @Column(name = "question", nullable = false)
    private String question;

    @NotBlank
    @Column(name = "answer", nullable = false)
    private String answer;
}
