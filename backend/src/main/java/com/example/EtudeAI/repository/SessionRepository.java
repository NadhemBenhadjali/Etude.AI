package com.example.EtudeAI.repository;

import com.example.EtudeAI.model.entity.Session;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {
    Page<Session> findByUserId(UUID userId, Pageable pageable);
}
