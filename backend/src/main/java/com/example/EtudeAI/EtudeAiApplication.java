package com.example.EtudeAI;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties
public class EtudeAiApplication {

	public static void main(String[] args) {
		SpringApplication.run(EtudeAiApplication.class, args);
	}

}
