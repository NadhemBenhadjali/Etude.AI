package com.example.EtudeAI.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

@Component
public class CookieBearerTokenFilter extends OncePerRequestFilter {

    private static final String ACCESS_COOKIE = "ACCESS_TOKEN";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String auth = request.getHeader("Authorization");
        if (!StringUtils.hasText(auth) && request.getCookies() != null) {
            Cookie cookie = Arrays.stream(request.getCookies())
                    .filter(c -> ACCESS_COOKIE.equals(c.getName()))
                    .findFirst()
                    .orElse(null);

            if (cookie != null && StringUtils.hasText(cookie.getValue())) {
                request = new MutableHttpServletRequest(request);
                ((MutableHttpServletRequest) request)
                        .putHeader("Authorization", "Bearer " + cookie.getValue());
            }
        }
        filterChain.doFilter(request, response);
    }
}
