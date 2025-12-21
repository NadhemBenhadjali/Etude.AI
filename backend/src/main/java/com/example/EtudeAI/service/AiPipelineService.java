package com.example.EtudeAI.service;

import com.example.EtudeAI.exception.AiServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import java.util.Map;

@Slf4j
@Service
public class AiPipelineService {

    private final WebClient webClient;

    public AiPipelineService(WebClient.Builder webClientBuilder,
            @Value("${ai-pipeline.url}") String aiPipelineUrl) {
        this.webClient = webClientBuilder.baseUrl(aiPipelineUrl).build();
    }

    public Mono<Map> getSummary(String subject, String module, String sessionId) {
        log.info("Calling AI Pipeline /summary with subject='{}', module='{}', sessionId='{}'", subject, module, sessionId);

        Map<String, String> requestBody = Map.of("subject", subject, "module", module);
        log.debug("Request body: {}", requestBody);

        return webClient.post()
                .uri("/summary")
                .header("X-Session-ID", sessionId)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(response -> log.info("Successfully received summary response"))
                .doOnError(error -> log.error("Error calling AI Pipeline: {}", error.getMessage()))
                .onErrorMap(WebClientResponseException.class, e -> {
                    String errorBody = e.getResponseBodyAsString();
                    log.error("AI Pipeline error while generating summary: Status={}, Response body: {}",
                            e.getStatusCode(), errorBody);
                    String errorMessage = String.format("AI Pipeline returned %s: %s",
                            e.getStatusCode(),
                            errorBody.isEmpty() ? e.getMessage() : errorBody);
                    return new AiServiceException("Summary", errorMessage, e);
                })
                .onErrorMap(e -> !(e instanceof AiServiceException), e -> {
                    log.error("Unexpected error while generating summary: {}", e.getMessage());
                    return new AiServiceException("Summary", "Failed to generate summary", e);
                });
    }

    public Mono<Map> askQuestion(String question, String sessionId) {
        var req = webClient.post()
                .uri("/qa")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON);

        if (StringUtils.hasText(sessionId)) {
            req = req.header("X-Session-ID", sessionId);
        }

        return req
                .bodyValue(Map.of("question", question))
                .retrieve()
                .bodyToMono(Map.class)
                .onErrorMap(WebClientResponseException.class, e -> {
                    log.error("AI Pipeline error while answering question: {}", e.getMessage());
                    return new AiServiceException("QA", e.getMessage(), e);
                })
                .onErrorMap(e -> !(e instanceof AiServiceException), e -> {
                    log.error("Unexpected error while answering question: {}", e.getMessage());
                    return new AiServiceException("QA", "Failed to answer question", e);
                });
    }

    public Mono<Map> generateQuiz(String module, int numMc, int numTf, String sessionId) {
        return webClient.post()
                .uri("/quiz")
                .header("X-Session-ID", sessionId)
                .bodyValue(Map.of("module", module, "num_mc", numMc, "num_tf", numTf))
                .retrieve()
                .bodyToMono(Map.class)
                .onErrorMap(WebClientResponseException.class, e -> {
                    log.error("AI Pipeline error while generating quiz: {}", e.getMessage());
                    return new AiServiceException("Quiz", e.getMessage(), e);
                })
                .onErrorMap(e -> !(e instanceof AiServiceException), e -> {
                    log.error("Unexpected error while generating quiz: {}", e.getMessage());
                    return new AiServiceException("Quiz", "Failed to generate quiz", e);
                });
    }

    public Mono<byte[]> generateTts(String text) {
        return webClient.post()
                .uri("/tts")
                .bodyValue(Map.of("text", text))
                .retrieve()
                .bodyToMono(byte[].class)
                .onErrorMap(WebClientResponseException.class, e -> {
                    log.error("AI Pipeline error while generating TTS: {}", e.getMessage());
                    return new AiServiceException("TTS", e.getMessage(), e);
                })
                .onErrorMap(e -> !(e instanceof AiServiceException), e -> {
                    log.error("Unexpected error while generating TTS: {}", e.getMessage());
                    return new AiServiceException("TTS", "Failed to generate audio", e);
                });
    }

    public Mono<Map> generatePlan(String goal, String time, String sessionId) {
        return webClient.post()
                .uri("/plan")
                .header("X-Session-ID", sessionId)
                .bodyValue(Map.of("goal", goal, "time", time))
                .retrieve()
                .bodyToMono(Map.class)
                .onErrorMap(WebClientResponseException.class, e -> {
                    log.error("AI Pipeline error while generating plan: {}", e.getMessage());
                    return new AiServiceException("Plan", e.getMessage(), e);
                })
                .onErrorMap(e -> !(e instanceof AiServiceException), e -> {
                    log.error("Unexpected error while generating plan: {}", e.getMessage());
                    return new AiServiceException("Plan", "Failed to generate study plan", e);
                });
    }
}
