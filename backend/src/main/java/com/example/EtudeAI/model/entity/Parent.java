package com.example.EtudeAI.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "parent")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Parent extends User {

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Child> children = new ArrayList<>();

    @Column(nullable = true, length = 15)
    @Size(min = 6, max = 15, message = "Phone number must be between 6 and 15 digits")
    @Pattern(regexp = "[0-9]*", message = "Phone number can only contain digits")
    private String phoneNumber;
}
