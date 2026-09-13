package com.example.EtudeAI.service.Implementation;

import com.example.EtudeAI.exception.AiServiceException;
import com.example.EtudeAI.model.dto.PlanRequestDTO;
import com.example.EtudeAI.service.AiPipelineService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
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
    public Flux<ServerSentEvent<String>> getSummary(String subject, String module, String sessionId) {
        log.info("Calling AI Pipeline SSE /summary with subject='{}', module='{}', sessionId='{}'", subject, module, sessionId);

        Map<String, String> requestBody = Map.of(
                "subject", subject != null ? subject : "",
                "module", module != null ? module : ""
        );

        ParameterizedTypeReference<ServerSentEvent<String>> typeRef = new ParameterizedTypeReference<>() {};

        var req = webClient.post()
                .uri("/summary")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.TEXT_EVENT_STREAM);

        if (StringUtils.hasText(sessionId)) {
            req = req.header("X-Session-ID", sessionId);
        }

        return req.bodyValue(requestBody)
                .retrieve()
                .bodyToFlux(typeRef)
                .doOnNext(event -> log.debug("Received SSE event: type={}", event.event()))
                .doOnComplete(() -> log.info("Completed SSE summary stream for module='{}'", module))
                .onErrorResume(WebClientResponseException.class, e -> {
                    String errorBody = e.getResponseBodyAsString();
                    log.error("AI Pipeline error during SSE summary: Status={}, Response body: {}",
                            e.getStatusCode(), errorBody);

                    String errorMessage = String.format("AI Pipeline returned %s: %s",
                            e.getStatusCode(),
                            errorBody.isEmpty() ? e.getMessage() : errorBody);

                    ServerSentEvent<String> errorEvent = ServerSentEvent.<String>builder()
                            .event("error")
                            .data("{\"error\": \"AiServiceException\", \"message\": \"" + errorMessage.replace("\"", "\\\"") + "\"}")
                            .build();

                    return Flux.just(errorEvent);
                })
                .onErrorResume(e -> {
                    log.error("Unexpected error during SSE summary: {}", e.getMessage());
                    ServerSentEvent<String> errorEvent = ServerSentEvent.<String>builder()
                            .event("error")
                            .data("{\"error\": \"AiServiceException\", \"message\": \"Failed to stream summary: " + (e.getMessage() != null ? e.getMessage().replace("\"", "\\\"") : "Unknown error") + "\"}")
                            .build();
                    return Flux.just(errorEvent);
                });
    }

    @Override
    public Mono<Map<String, Object>> askQuestion(String question, String sessionId) {
        log.info("Calling AI Pipeline /qa with sessionId='{}'", sessionId);
        log.debug("Question payload: '{}'", question);

        var req = webClient.post()
                .uri("/qa")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON);

        if (StringUtils.hasText(sessionId)) {
            req = req.header("X-Session-ID", sessionId);
        }

        return req.bodyValue(Map.of("question", question != null ? question : ""))
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                })
                .doOnSuccess(response -> log.info("Successfully received QA response"))
                .onErrorMap(WebClientResponseException.class, e -> {
                    String errorBody = e.getResponseBodyAsString();
                    log.error("AI Pipeline error while answering question: Status={}, Response body: {}", e.getStatusCode(), errorBody);

                    String errorMessage = String.format("AI Pipeline returned %s: %s",
                            e.getStatusCode(), errorBody.isEmpty() ? e.getMessage() : errorBody);

                    return new AiServiceException("QA", errorMessage, e);
                })
                .onErrorMap(e -> !(e instanceof AiServiceException), e -> {
                    log.error("Unexpected error while answering question: {}", e.getMessage());
                    return new AiServiceException("QA", "Failed to answer question", e);
                });
    }

    @Override
    public Mono<Map<String, Object>> generateQuiz(String module, int numMc, int numTf, String sessionId) {
        log.info("Calling AI Pipeline /quiz with module='{}', numMc={}, numTf={}, sessionId='{}'",
                module, numMc, numTf, sessionId);

        Map<String, Object> requestBody = Map.of(
                "module", module != null ? module : "",
                "num_mc", numMc,
                "num_tf", numTf
        );

        var req = webClient.post()
                .uri("/quiz")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON);

        if (StringUtils.hasText(sessionId)) {
            req = req.header("X-Session-ID", sessionId);
        }

        return req.bodyValue(requestBody)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                })
                .doOnSuccess(response -> log.info("Successfully generated quiz for module='{}'", module))
                .onErrorMap(WebClientResponseException.class, e -> {
                    String errorBody = e.getResponseBodyAsString();
                    log.error("AI Pipeline error while generating quiz: Status={}, Response body: {}",
                            e.getStatusCode(), errorBody);

                    String errorMessage = String.format("AI Pipeline returned %s: %s",
                            e.getStatusCode(), errorBody.isEmpty() ? e.getMessage() : errorBody);

                    return new AiServiceException("Quiz", errorMessage, e);
                })
                .onErrorMap(e -> !(e instanceof AiServiceException), e -> {
                    log.error("Unexpected error while generating quiz: {}", e.getMessage());
                    return new AiServiceException("Quiz", "Failed to generate quiz", e);
                });
    }

    @Override
    public Mono<byte[]> generateTts(String text) {
        int textLength = text != null ? text.length() : 0;
        log.info("Calling AI Pipeline /tts (text length: {} chars)", textLength);

        var req = webClient.post()
                .uri("/tts")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_OCTET_STREAM, MediaType.ALL);

        return req.bodyValue(Map.of("text", text != null ? text : ""))
                .retrieve()
                .bodyToMono(byte[].class)
                .doOnSuccess(audioBytes ->
                        log.info("Successfully generated TTS audio ({} bytes received)", audioBytes != null ? audioBytes.length : 0)
                )
                .onErrorMap(WebClientResponseException.class, e -> {
                    String errorBody = e.getResponseBodyAsString();
                    log.error("AI Pipeline error while generating TTS: Status={}, Response body: {}",
                            e.getStatusCode(), errorBody);

                    String errorMessage = String.format("AI Pipeline returned %s: %s",
                            e.getStatusCode(),
                            errorBody.isEmpty() ? e.getMessage() : errorBody);

                    return new AiServiceException("TTS", errorMessage, e);
                })
                .onErrorMap(e -> !(e instanceof AiServiceException), e -> {
                    log.error("Unexpected error while generating TTS: {}", e.getMessage());
                    return new AiServiceException("TTS", "Failed to generate audio", e);
                });
    }

    @Override
    public Mono<Map<String, Object>> health() {
        var req = webClient.get()
                .uri("/health")
                .accept(MediaType.APPLICATION_JSON);

        return req.retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .timeout(Duration.ofSeconds(3))
                .onErrorReturn(Map.of("status", "DOWN", "error", "AI Pipeline unreachable"));
    }

    @Override
    public Mono<Map<String, Object>> generatePlan(PlanRequestDTO planRequest, String authorizationHeader, String sessionId) {
        log.info("Calling AI Pipeline /plan with goal='{}', time_available='{}', branch='{}', topic='{}', sessionId='{}'",
                planRequest.getGoal(), planRequest.getTime_available(), planRequest.getBranch(), planRequest.getTopic(), sessionId);

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

        if (StringUtils.hasText(authorizationHeader)) {
            request = request.header("Authorization", authorizationHeader);
            log.debug("Authorization header added to request");
        }

        return request
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
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
