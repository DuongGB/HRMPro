package com.hrmpro.module.organization.controller;

import com.hrmpro.common.dto.ApiResponse;
import com.hrmpro.module.organization.dto.PositionRequest;
import com.hrmpro.module.organization.dto.PositionResponse;
import com.hrmpro.module.organization.service.PositionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/positions")
@RequiredArgsConstructor
public class PositionController {

    private final PositionService positionService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<PositionResponse>>> getAllPositions() {
        List<PositionResponse> list = positionService.getAllPositions();
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách chức danh thành công", list));
    }

    @GetMapping("/department/{departmentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<PositionResponse>>> getPositionsByDepartment(@PathVariable Long departmentId) {
        List<PositionResponse> list = positionService.getPositionsByDepartment(departmentId);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách chức danh theo phòng ban thành công", list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PositionResponse>> getPosition(@PathVariable Long id) {
        PositionResponse response = positionService.getPosition(id);
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết chức danh thành công", response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<PositionResponse>> createPosition(@Valid @RequestBody PositionRequest request) {
        PositionResponse response = positionService.createPosition(request);
        return ResponseEntity.ok(ApiResponse.ok("Tạo chức danh thành công", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<PositionResponse>> updatePosition(
            @PathVariable Long id,
            @Valid @RequestBody PositionRequest request
    ) {
        PositionResponse response = positionService.updatePosition(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật chức danh thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePosition(@PathVariable Long id) {
        positionService.deletePosition(id);
        return ResponseEntity.ok(ApiResponse.ok("Ngừng hoạt động chức danh thành công", null));
    }
}
