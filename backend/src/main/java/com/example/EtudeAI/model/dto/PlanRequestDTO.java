package com.example.EtudeAI.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanRequestDTO {
    private String goal;
    private String time_available;
    private String branch;
    private String topic;
    private List<String> obstacles;
    private String parent_remark;
}
