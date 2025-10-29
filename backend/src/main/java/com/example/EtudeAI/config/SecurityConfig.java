package com.example.EtudeAI.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.oidc.web.logout.OidcClientInitiatedLogoutSuccessHandler;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;

import java.util.Collection;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${app.security.client-id}")
    private String clientId;

    @Value("${app.security.allowed-origins}")
    private List<String> allowedOrigins;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
                                            ClientRegistrationRepository clientRegistrationRepository,
                                            CookieBearerTokenFilter cookieBearerTokenFilter) throws Exception {

        // CORS / CSRF
        http.cors(cors -> cors.configurationSource(this::corsConfiguration));
        http.csrf(csrf -> csrf.ignoringRequestMatchers("/api/auth/**"));

        // URL authz
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/login", "/css/**", "/js/**", "/images/**").permitAll()
                .requestMatchers("/oauth2/**", "/login/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/**").authenticated()
                .anyRequest().authenticated()
        );

        // OAuth2 login (Option A) with a post-login redirect back to Angular
        http.oauth2Login(oauth -> oauth
                .loginPage("/login")
                .successHandler((request, response, authentication) ->
                        response.sendRedirect(frontendBaseUrl + "/landing"))
        );

        // JWT resource server (accepts Bearer tokens if your SPA ever sends them)
        http.oauth2ResourceServer(oauth ->
                oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
        );

        // Optional: translate ACCESS_TOKEN cookie into Authorization header (harmless if unused)
        http.addFilterBefore(cookieBearerTokenFilter,
                org.springframework.security.web.authentication.www.BasicAuthenticationFilter.class);

        // OIDC RP-initiated logout; redirect back to Angular afterwards
        var oidcLogout = new OidcClientInitiatedLogoutSuccessHandler(clientRegistrationRepository);
        oidcLogout.setPostLogoutRedirectUri(frontendBaseUrl + "/");
        http.logout(logout -> logout.logoutSuccessHandler(oidcLogout));

        return http.build();
    }

    private CorsConfiguration corsConfiguration(HttpServletRequest request) {
        var c = new CorsConfiguration();
        c.setAllowedOrigins(allowedOrigins);
        c.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
        c.setAllowedHeaders(List.of("Authorization","Content-Type","X-Requested-With"));
        c.setAllowCredentials(true);
        return c;
    }

    private JwtAuthenticationConverter jwtAuthenticationConverter() {
        var jwtAuthConverter = new JwtAuthenticationConverter();
        Converter<Jwt, Collection<GrantedAuthority>> keycloakConverter =
                new KeycloakJwtGrantedAuthoritiesConverter(clientId);
        jwtAuthConverter.setJwtGrantedAuthoritiesConverter(keycloakConverter);
        return jwtAuthConverter;
    }
}
