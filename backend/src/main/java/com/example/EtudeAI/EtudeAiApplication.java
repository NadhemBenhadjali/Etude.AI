package com.example.EtudeAI;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableConfigurationProperties
@EnableCaching
public class EtudeAiApplication {

	public static void main(String[] args) {
		SpringApplication.run(EtudeAiApplication.class, args);
	}

}
