package com.example.EtudeAI.Controller;

import com.example.EtudeAI.service.AiPipelineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Operations", description = "Endpoints for interacting with the AI Pipeline (Summary, QA, Quiz, Plan)")
public class AiController {

        private final AiPipelineService aiPipelineService;

        @PostMapping("/summary")
        @Operation(summary = "Generate Summary", description = "Generates a lesson summary for a specific module.")
        public Mono<ResponseEntity<Map>> getSummary(@RequestBody Map<String, String> payload,
                        @Parameter(description = "Session ID for tracking context") @RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
                String finalSessionId = (sessionId != null && !sessionId.isEmpty()) ? sessionId
                                : UUID.randomUUID().toString();

                String subject = payload.get("subject");
                String module = payload.get("module");

                if (subject == null || subject.isEmpty()) {
                        throw new IllegalArgumentException("Subject is required");
                }
                if (module == null || module.isEmpty()) {
                        throw new IllegalArgumentException("Module is required");
                }

                return aiPipelineService.getSummary(subject, module, finalSessionId)
                                .map(response -> ResponseEntity.ok().header("X-Session-ID", finalSessionId)
                                                .body(response));
        }

        @PostMapping("/qa")
        @Operation(summary = "Ask Question", description = "Asks a question to the AI chatbot within the context of the session.")
        public Mono<ResponseEntity<Map>> askQuestion(@RequestBody Map<String, String> payload,
                        @Parameter(description = "Session ID for tracking context") @RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
                String finalSessionId = (sessionId != null && !sessionId.isEmpty()) ? sessionId
                                : UUID.randomUUID().toString();
                return aiPipelineService.askQuestion(payload.get("question"), finalSessionId)
                                .map(response -> ResponseEntity.ok().header("X-Session-ID", finalSessionId)
                                                .body(response));
        }

        @PostMapping("/quiz")
        @Operation(summary = "Generate Quiz", description = "Generates a quiz based on a module.")
        public Mono<ResponseEntity<Map>> generateQuiz(@RequestBody Map<String, Object> payload,
                        @Parameter(description = "Session ID for tracking context") @RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
                String finalSessionId = (sessionId != null && !sessionId.isEmpty()) ? sessionId
                                : UUID.randomUUID().toString();
                String module = (String) payload.get("module");
                int numMc = (int) payload.getOrDefault("num_mc", 6);
                int numTf = (int) payload.getOrDefault("num_tf", 4);

                return aiPipelineService.generateQuiz(module, numMc, numTf, finalSessionId)
                                .map(response -> ResponseEntity.ok().header("X-Session-ID", finalSessionId)
                                                .body(response));
        }

        @PostMapping(value = "/tts", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
        @Operation(summary = "Generate TTS", description = "Converts text to speech (MP3).")
        public Mono<ResponseEntity<byte[]>> generateTts(@RequestBody Map<String, String> payload) {
                return aiPipelineService.generateTts(payload.get("text"))
                                .map(bytes -> ResponseEntity.ok()
                                                .header("Content-Disposition", "attachment; filename=\"speech.mp3\"")
                                                .body(bytes));
        }

        @PostMapping("/plan")
        @Operation(summary = "Generate Study Plan", description = "Generates a study plan based on goal and available time.")
        public Mono<ResponseEntity<Map>> generatePlan(@RequestBody Map<String, String> payload,
                        @Parameter(description = "Session ID for tracking context") @RequestHeader(value = "X-Session-ID", required = false) String sessionId) {
                String finalSessionId = (sessionId != null && !sessionId.isEmpty()) ? sessionId
                                : UUID.randomUUID().toString();
                return aiPipelineService.generatePlan(payload.get("goal"), payload.get("time"), finalSessionId)
                                .map(response -> ResponseEntity.ok().header("X-Session-ID", finalSessionId)
                                                .body(response));
        }
}
