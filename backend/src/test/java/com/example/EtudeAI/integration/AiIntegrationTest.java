package com.example.EtudeAI.integration;

import com.example.EtudeAI.model.dto.RegistrationDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

/**
 * Integration tests for Etude.AI Backend
 * Tests the complete flow of requests through controllers, services, and repositories.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Health endpoint should return UP status")
    public void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").exists());
    }

    @Test
    @DisplayName("Prometheus metrics endpoint should return metrics")
    public void testPrometheusMetricsEndpoint() throws Exception {
        mockMvc.perform(get("/actuator/prometheus"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_PLAIN));
    }

    @Test
    @DisplayName("AI Summary endpoint should proxy request with session ID")
    public void testAiSummaryEndpoint() throws Exception {
        String payload = "{\"module\":\"التنفس\"}";

        mockMvc.perform(post("/api/ai/summary")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)
                .header("X-Session-ID", "test-session-123"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Session-ID"));
    }

    @Test
    @DisplayName("AI Q&A endpoint should proxy request")
    public void testAiQAEndpoint() throws Exception {
        String payload = "{\"question\":\"ما هو التنفس؟\"}";

        mockMvc.perform(post("/api/ai/qa")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)
                .header("X-Session-ID", "test-session-123"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Session-ID"));
    }

    @Test
    @DisplayName("AI Quiz endpoint should proxy request")
    public void testAiQuizEndpoint() throws Exception {
        String payload = "{\"module\":\"التنفس\",\"num_mc\":5,\"num_tf\":3}";

        mockMvc.perform(post("/api/ai/quiz")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)
                .header("X-Session-ID", "test-session-123"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Session-ID"));
    }

    @Test
    @DisplayName("AI Plan endpoint should proxy request")
    public void testAiPlanEndpoint() throws Exception {
        String payload = "{\"goal\":\"أريد تعلم الأحياء\",\"time\":\"أسبوعين\"}";

        mockMvc.perform(post("/api/ai/plan")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload)
                .header("X-Session-ID", "test-session-123"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Session-ID"));
    }

    @Test
    @DisplayName("Registration endpoint should validate input")
    public void testRegistrationValidation() throws Exception {
        RegistrationDTO invalidDto = new RegistrationDTO();
        // Missing required fields - should fail validation

        mockMvc.perform(post("/api/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidDto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Global exception handler should catch errors")
    public void testGlobalExceptionHandler() throws Exception {
        // Test non-existent endpoint to trigger 404
        mockMvc.perform(get("/api/nonexistent"))
                .andExpect(status().isNotFound());
    }
}

