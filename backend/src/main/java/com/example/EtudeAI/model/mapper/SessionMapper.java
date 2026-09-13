package com.example.EtudeAI.model.mapper;


import com.example.EtudeAI.model.dto.SessionDTO;
import com.example.EtudeAI.model.dto.SessionUpdateDTO;
import com.example.EtudeAI.model.entity.Session;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface SessionMapper {

    SessionDTO toDTO(Session session);

    @Mapping(target = "user", ignore = true)
    Session toEntity(SessionDTO dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateSessionFromDto(SessionDTO dto, @MappingTarget Session session);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateSessionFromUpdateDto(SessionUpdateDTO dto, @MappingTarget Session session);

    @AfterMapping
    default void linkChildElements(@MappingTarget Session session) {
        if (session.getQuizElements() != null) {
            session.getQuizElements().forEach(element -> element.setSession(session));
        }
        if (session.getQnaElements() != null) {
            session.getQnaElements().forEach(element -> element.setSession(session));
        }
        if (session.getSummaryElements() != null) {
            session.getSummaryElements().forEach(element -> element.setSession(session));
        }
    }
}
