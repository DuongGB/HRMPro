package com.hrmpro.module.performance.controller;

import com.hrmpro.config.TestSecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrmpro.config.SecurityConfig;
import com.hrmpro.config.HrmSecurityEvaluator;
import com.hrmpro.module.auth.entity.UserPrincipal;
import com.hrmpro.module.performance.dto.PerformanceReviewDto;
import com.hrmpro.module.performance.dto.ReviewCycleDto;
import com.hrmpro.module.performance.entity.PerformanceReview;
import com.hrmpro.module.performance.entity.ReviewCycle;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.performance.service.PerformanceService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PerformanceController.class)
@Import({SecurityConfig.class, TestSecurityConfig.class})
@ActiveProfiles("test")
@DisplayName("PerformanceController Integration Tests (MockMvc)")
class PerformanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PerformanceService performanceService;


    @MockBean(name = "hrmSecurity")
    private HrmSecurityEvaluator hrmSecurity;


    @Test
    @DisplayName("GET /api/v1/performance/cycles — thành công → 200")
    @WithMockUser
    void getCycles_Success() throws Exception {
        ReviewCycle cycle = ReviewCycle.builder().id(1L).name("Kỳ 1").status("DRAFT").build();
        when(performanceService.getAllCycles()).thenReturn(List.of(cycle));

        mockMvc.perform(get("/api/v1/performance/cycles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Kỳ 1"));
    }

    @Test
    @DisplayName("POST /api/v1/performance/reviews/{id}/self — tự đánh giá thành công → 200")
    void selfEvaluate_Success() throws Exception {
        UserPrincipal principal = UserPrincipal.builder()
                .id(1L)
                .username("employee1")
                .employeeId(10L)
                .isActive(true)
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE")))
                .build();

        Employee emp = Employee.builder().id(10L).firstName("John").lastName("Doe").build();
        ReviewCycle cycle = ReviewCycle.builder().id(1L).name("Kỳ 1").build();
        PerformanceReview review = PerformanceReview.builder()
                .id(100L)
                .employee(emp)
                .reviewer(Employee.builder().id(2L).build())
                .cycle(cycle)
                .status("PENDING")
                .build();

        PerformanceReview updatedReview = PerformanceReview.builder()
                .id(100L)
                .employee(emp)
                .reviewer(Employee.builder().id(2L).build())
                .cycle(cycle)
                .selfScore(BigDecimal.valueOf(4.0))
                .status("MANAGER_EVALUATING")
                .build();

        PerformanceReviewDto evalDto = PerformanceReviewDto.builder()
                .selfScore(BigDecimal.valueOf(4.0))
                .strengths("Tốt")
                .improvements("Không")
                .goalsNext("Đạt KPI")
                .build();

        when(performanceService.getReview(100L)).thenReturn(review);
        when(performanceService.selfEvaluate(eq(100L), any(), any(), any(), any())).thenReturn(updatedReview);
        when(performanceService.getKpisByReview(100L)).thenReturn(Collections.emptyList());

        mockMvc.perform(post("/api/v1/performance/reviews/100/self")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(evalDto))
                        .with(user(principal))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("MANAGER_EVALUATING"));
    }
}
