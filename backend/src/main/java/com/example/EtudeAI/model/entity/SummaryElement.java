package com.example.EtudeAI.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.UUID;


@Entity
@Table(name = "summary_element")
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SummaryElement {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private Session session;

    @NotBlank
    @Column(name = "content", nullable = false)
    private String content;


}
