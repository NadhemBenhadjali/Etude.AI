package com.example.EtudeAI.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Aspect
@Component
@Slf4j
public class LoggingAspect {

    private static final String REQUEST_ID = "requestId";

    /**
     * Pointcut for all controller methods
     */
    @Pointcut("within(@org.springframework.web.bind.annotation.RestController *)")
    public void controllerMethods() {
    }

    /**
     * Pointcut for all service methods
     */
    @Pointcut("within(@org.springframework.stereotype.Service *)")
    public void serviceMethods() {
    }

    /**
     * Log before executing controller methods.
     * Note: Arguments are intentionally NOT logged to prevent leaking sensitive data
     * (passwords, tokens, etc.) into logs.
     */
    @Before("controllerMethods()")
    public void logBeforeController(JoinPoint joinPoint) {
        // Generate request ID for tracing if not already set
        if (MDC.get(REQUEST_ID) == null) {
            MDC.put(REQUEST_ID, UUID.randomUUID().toString().substring(0, 8));
        }
        String methodName = joinPoint.getSignature().toShortString();
        String requestId = MDC.get(REQUEST_ID);
        log.info("[{}] Entering controller method: {}", requestId, methodName);
    }

    /**
     * Log after returning from controller methods
     */
    @AfterReturning(pointcut = "controllerMethods()", returning = "result")
    public void logAfterReturningController(JoinPoint joinPoint, Object result) {
        String methodName = joinPoint.getSignature().toShortString();
        String requestId = MDC.get(REQUEST_ID);
        log.info("[{}] Controller method completed: {}", requestId, methodName);
        MDC.remove(REQUEST_ID);
    }

    /**
     * Log exceptions thrown from controller and service methods
     */
    @AfterThrowing(pointcut = "controllerMethods() || serviceMethods()", throwing = "exception")
    public void logAfterThrowing(JoinPoint joinPoint, Throwable exception) {
        String methodName = joinPoint.getSignature().toShortString();
        String requestId = MDC.get(REQUEST_ID);
        log.error("[{}] Exception in method: {} - Exception: {}", requestId, methodName, exception.getMessage(), exception);
        MDC.remove(REQUEST_ID);
    }

    /**
     * Log execution time for service methods
     */
    @Around("serviceMethods()")
    public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().toShortString();
        long startTime = System.currentTimeMillis();

        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;
            log.debug("Service method: {} executed in {} ms", methodName, executionTime);
            return result;
        } catch (Throwable throwable) {
            long executionTime = System.currentTimeMillis() - startTime;
            log.error("Service method: {} failed after {} ms", methodName, executionTime);
            throw throwable;
        }
    }
}

