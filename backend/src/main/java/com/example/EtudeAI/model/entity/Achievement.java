package com.example.EtudeAI.model.entity;

import com.example.EtudeAI.model.enums.CriteriaType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "achievement")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Achievement {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String name;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String icon; // Icon name (e.g., "star", "trophy") or URL

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CriteriaType criteriaType;

    @Column(nullable = false)
    private Integer criteriaValue;
}
