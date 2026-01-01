package com.example.EtudeAI.service.Implementation;

import com.example.EtudeAI.exception.AiServiceException;
import com.example.EtudeAI.model.dto.PlanRequestDTO;
import com.example.EtudeAI.service.AiPipelineService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class AiPipelineServiceImpl implements AiPipelineService {

    private final WebClient webClient;

    public AiPipelineServiceImpl(WebClient.Builder webClientBuilder,
            @Value("${ai-pipeline.url}") String aiPipelineUrl) {
        this.webClient = webClientBuilder.baseUrl(aiPipelineUrl).build();
    }
    @Override
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

    @Override
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

    @Override
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

    @Override
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

    @Override
    public Mono<Map> health() {
    return webClient
            .get()
            .uri("/health")
            .retrieve()
            .bodyToMono(Map.class);}

    @Override
    public Mono<Map> generatePlan(PlanRequestDTO planRequest, String authorizationHeader, String sessionId) {
        log.info("Calling AI Pipeline /plan with goal='{}', time_available='{}', branch='{}', topic='{}', sessionId='{}'",
                planRequest.getGoal(), planRequest.getTime_available(), planRequest.getBranch(), planRequest.getTopic(), sessionId);

        // Build request body with all fields
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("goal", planRequest.getGoal() != null ? planRequest.getGoal() : "");
        requestBody.put("time_available", planRequest.getTime_available() != null ? planRequest.getTime_available() : "");
        requestBody.put("branch", planRequest.getBranch() != null ? planRequest.getBranch() : "");
        requestBody.put("topic", planRequest.getTopic() != null ? planRequest.getTopic() : "");

        // Note: obstacles and parent_remark are not currently used by AI Pipeline /plan endpoint
        // but can be added if needed in the future

        log.debug("Request body: {}", requestBody);

        var request = webClient.post()
                .uri("/plan")
                .header("X-Session-ID", sessionId)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON);

        // Add Authorization header if present
        if (StringUtils.hasText(authorizationHeader)) {
            request = request.header("Authorization", authorizationHeader);
            log.debug("Authorization header added to request");
        }

        return request
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(response -> log.info("Successfully received plan response"))
                .doOnError(error -> log.error("Error calling AI Pipeline /plan: {}", error.getMessage()))
                .onErrorMap(WebClientResponseException.class, e -> {
                    String errorBody = e.getResponseBodyAsString();
                    log.error("AI Pipeline error while generating plan: Status={}, Response body: {}",
                            e.getStatusCode(), errorBody);
                    String errorMessage = String.format("AI Pipeline returned %s: %s",
                            e.getStatusCode(),
                            errorBody.isEmpty() ? e.getMessage() : errorBody);
                    return new AiServiceException("Plan", errorMessage, e);
                })
                .onErrorMap(e -> !(e instanceof AiServiceException), e -> {
                    log.error("Unexpected error while generating plan: {}", e.getMessage());
                    return new AiServiceException("Plan", "Failed to generate study plan", e);
                });
    }
}
