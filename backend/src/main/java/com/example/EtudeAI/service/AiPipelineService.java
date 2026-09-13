package com.example.EtudeAI.service;

import com.example.EtudeAI.model.dto.PlanRequestDTO;
import org.springframework.http.codec.ServerSentEvent;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

public interface AiPipelineService {

    Flux<ServerSentEvent<String>> getSummary(String subject, String module, String sessionId);

    Mono<Map<String, Object>> askQuestion(String question, String sessionId);

    Mono<Map<String, Object>> generateQuiz(String module, int numMc, int numTf, String sessionId);

    Mono<byte[]> generateTts(String text);

    Mono<Map<String, Object>> health();

    Mono<Map<String, Object>> generatePlan(PlanRequestDTO planRequest, String authorizationHeader, String sessionId);
}
