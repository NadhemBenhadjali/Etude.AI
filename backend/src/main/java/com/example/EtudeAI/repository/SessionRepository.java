package com.example.EtudeAI.repository;

import com.example.EtudeAI.model.entity.Session;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {
    Page<Session> findByUserId(UUID userId, Pageable pageable);

    @EntityGraph(attributePaths = {"summaryElements", "quizElements", "qnaElements"})
    @Query("SELECT s FROM Session s WHERE s.id = :id")
    Optional<Session> findByIdWithElements(@Param("id") UUID id);
}
