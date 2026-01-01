package com.example.EtudeAI.service;

import com.example.EtudeAI.model.dto.PlanRequestDTO;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface AiPipelineService {

    Mono<Map> getSummary(String subject, String module, String sessionId);

    Mono<Map> askQuestion(String question, String sessionId);

    Mono<Map> generateQuiz(String module, int numMc, int numTf, String sessionId);

    Mono<byte[]> generateTts(String text);

    Mono<Map> health();

    Mono<Map> generatePlan(PlanRequestDTO planRequest, String authorizationHeader, String sessionId);
}
