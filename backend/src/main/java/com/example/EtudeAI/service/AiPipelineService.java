package com.example.EtudeAI.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.Map;

@Service
public class AiPipelineService {

    private final WebClient webClient;

    public AiPipelineService(WebClient.Builder webClientBuilder,
            @Value("${AI_PIPELINE_URL:http://localhost:8000}") String aiPipelineUrl) {
        this.webClient = webClientBuilder.baseUrl(aiPipelineUrl).build();
    }

    public Mono<Map> getSummary(String module, String sessionId) {
        return webClient.post()
                .uri("/summary")
                .header("X-Session-ID", sessionId)
                .bodyValue(Map.of("module", module))
                .retrieve()
                .bodyToMono(Map.class);
    }

    public Mono<Map> askQuestion(String question, String sessionId) {
        return webClient.post()
                .uri("/qa")
                .header("X-Session-ID", sessionId)
                .bodyValue(Map.of("question", question))
                .retrieve()
                .bodyToMono(Map.class);
    }

    public Mono<Map> generateQuiz(String module, int numMc, int numTf, String sessionId) {
        return webClient.post()
                .uri("/quiz")
                .header("X-Session-ID", sessionId)
                .bodyValue(Map.of("module", module, "num_mc", numMc, "num_tf", numTf))
                .retrieve()
                .bodyToMono(Map.class);
    }

    public Mono<byte[]> generateTts(String text) {
        return webClient.post()
                .uri("/tts")
                .bodyValue(Map.of("text", text))
                .retrieve()
                .bodyToMono(byte[].class);
    }

    public Mono<Map> generatePlan(String goal, String time, String sessionId) {
        return webClient.post()
                .uri("/plan")
                .header("X-Session-ID", sessionId)
                .bodyValue(Map.of("goal", goal, "time", time))
                .retrieve()
                .bodyToMono(Map.class);
    }
}
