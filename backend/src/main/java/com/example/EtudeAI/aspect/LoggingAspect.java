package com.example.EtudeAI.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Aspect
@Component
@Slf4j
public class LoggingAspect {

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
     * Log before executing controller methods
     */
    @Before("controllerMethods()")
    public void logBeforeController(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().toShortString();
        Object[] args = joinPoint.getArgs();
        log.info("Entering controller method: {} with arguments: {}", methodName, Arrays.toString(args));
    }

    /**
     * Log after returning from controller methods
     */
    @AfterReturning(pointcut = "controllerMethods()", returning = "result")
    public void logAfterReturningController(JoinPoint joinPoint, Object result) {
        String methodName = joinPoint.getSignature().toShortString();
        log.info("Controller method completed: {}", methodName);
    }

    /**
     * Log exceptions thrown from controller and service methods
     */
    @AfterThrowing(pointcut = "controllerMethods() || serviceMethods()", throwing = "exception")
    public void logAfterThrowing(JoinPoint joinPoint, Throwable exception) {
        String methodName = joinPoint.getSignature().toShortString();
        log.error("Exception in method: {} - Exception: {}", methodName, exception.getMessage(), exception);
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

