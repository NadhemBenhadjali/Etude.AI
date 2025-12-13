package com.example.EtudeAI.repository;

import com.example.EtudeAI.model.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, UUID> {
    Optional<Achievement> findByName(String name);
}
