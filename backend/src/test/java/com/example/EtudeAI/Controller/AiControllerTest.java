package com.example.EtudeAI.Controller;

import com.example.EtudeAI.service.AiPipelineService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf;

@WebFluxTest(controllers = AiController.class)
public class AiControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private AiPipelineService aiPipelineService;

    @Test
    @WithMockUser
    void getSummary_ShouldReturnOk_WhenServiceReturnsResponse() {
        when(aiPipelineService.getSummary(anyString(), anyString()))
                .thenReturn(Mono.just(Map.of("data", "summary content")));

        webTestClient.mutateWith(csrf())
                .post().uri("/api/ai/summary")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("module", "Test Module"))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.data").isEqualTo("summary content");
    }

    @Test
    @WithMockUser
    void askQuestion_ShouldReturnOk_WhenServiceReturnsResponse() {
        when(aiPipelineService.askQuestion(anyString(), anyString()))
                .thenReturn(Mono.just(Map.of("answer", "42")));

        webTestClient.mutateWith(csrf())
                .post().uri("/api/ai/qa")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("question", "What is the answer?"))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.answer").isEqualTo("42");
    }

    @Test
    @WithMockUser
    void generateQuiz_ShouldReturnOk_WhenServiceReturnsResponse() {
        when(aiPipelineService.generateQuiz(anyString(), anyInt(), anyInt(), anyString()))
                .thenReturn(Mono.just(Map.of("quiz", "questions")));

        webTestClient.mutateWith(csrf())
                .post().uri("/api/ai/quiz")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("module", "Math", "num_mc", 5, "num_tf", 5))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.quiz").isEqualTo("questions");
    }
}
