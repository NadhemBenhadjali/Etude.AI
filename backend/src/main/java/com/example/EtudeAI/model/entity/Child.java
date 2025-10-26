package com.example.EtudeAI.model.entity;

import com.example.EtudeAI.model.enums.Level;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "child")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Child extends User {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", nullable = false)
    @NotNull(message = "Parent must be specified")
    private Parent parent;

    @Temporal(TemporalType.DATE)
    @Column(nullable = false)
    @NotNull(message = "Birth date must be specified")
    private Date birthDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NotNull(message = "Level must be specified")
    private Level level;

    @OneToMany(mappedBy = "child", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Note> strongPoints = new ArrayList<>();

    @OneToMany(mappedBy = "child", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Note> weakPoints = new ArrayList<>();

    @Column(nullable = false)
    @Min(value = 0, message = "ELO must be greater than or equal to 0")
    private Integer elo = 1000;
}
