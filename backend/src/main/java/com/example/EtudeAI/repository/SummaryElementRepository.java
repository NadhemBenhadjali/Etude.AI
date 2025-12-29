package com.example.EtudeAI.repository;

import com.example.EtudeAI.model.entity.SummaryElement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SummaryElementRepository extends JpaRepository<SummaryElement, UUID> {
    List<SummaryElement> findBySessionIdOrderByIdAsc(UUID sessionId);
    void deleteBySessionId(UUID sessionId);
}

