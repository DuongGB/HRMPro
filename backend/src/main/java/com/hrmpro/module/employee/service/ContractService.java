package com.hrmpro.module.employee.service;

import com.hrmpro.common.exception.AppException;
import com.hrmpro.common.exception.ResourceNotFoundException;
import com.hrmpro.common.service.MinioService;
import com.hrmpro.module.employee.dto.ContractRequest;
import com.hrmpro.module.employee.dto.ContractResponse;
import com.hrmpro.module.employee.entity.Contract;
import com.hrmpro.module.employee.entity.Employee;
import com.hrmpro.module.employee.repository.ContractRepository;
import com.hrmpro.module.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractService {

    private final ContractRepository contractRepository;
    private final EmployeeRepository employeeRepository;
    private final MinioService minioService;

    @Value("${app.minio.bucket.documents:hrmpro-documents}")
    private String documentBucket;

    @Transactional(readOnly = true)
    public List<ContractResponse> getContractsByEmployee(Long employeeId) {
        if (!employeeRepository.existsById(employeeId)) {
            throw new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + employeeId);
        }
        return contractRepository.findByEmployeeId(employeeId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ContractResponse getContract(Long id) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng với ID: " + id));
        return convertToResponse(contract);
    }

    @Transactional
    public ContractResponse createContract(Long employeeId, ContractRequest request, MultipartFile documentFile) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + employeeId));

        if (contractRepository.existsByContractNumber(request.getContractNumber())) {
            throw new AppException("Số hợp đồng '" + request.getContractNumber() + "' đã tồn tại", HttpStatus.BAD_REQUEST);
        }

        String documentUrl = null;
        if (documentFile != null && !documentFile.isEmpty()) {
            documentUrl = uploadContractDocument(employee.getEmployeeCode(), documentFile);
        }

        Contract contract = Contract.builder()
                .employee(employee)
                .contractNumber(request.getContractNumber())
                .contractType(request.getContractType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .baseSalary(request.getBaseSalary())
                .documentUrl(documentUrl)
                .signedAt(request.getSignedAt())
                .notes(request.getNotes())
                .status("ACTIVE")
                .build();

        Contract saved = contractRepository.save(contract);
        log.info("Đã tạo hợp đồng lao động mới số: {} cho nhân viên: {}", saved.getContractNumber(), employee.getFullName());
        return convertToResponse(saved);
    }

    @Transactional
    public ContractResponse updateContract(Long contractId, ContractRequest request, MultipartFile documentFile) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng với ID: " + contractId));

        if (!contract.getContractNumber().equalsIgnoreCase(request.getContractNumber()) && 
                contractRepository.existsByContractNumber(request.getContractNumber())) {
            throw new AppException("Số hợp đồng '" + request.getContractNumber() + "' đã tồn tại ở hợp đồng khác", HttpStatus.BAD_REQUEST);
        }

        if (documentFile != null && !documentFile.isEmpty()) {
            // Xóa file tài liệu cũ trên MinIO nếu có
            if (contract.getDocumentUrl() != null) {
                minioService.deleteFile(documentBucket, contract.getDocumentUrl());
            }
            String newDocumentUrl = uploadContractDocument(contract.getEmployee().getEmployeeCode(), documentFile);
            contract.setDocumentUrl(newDocumentUrl);
        }

        contract.setContractNumber(request.getContractNumber());
        contract.setContractType(request.getContractType());
        contract.setStartDate(request.getStartDate());
        contract.setEndDate(request.getEndDate());
        contract.setBaseSalary(request.getBaseSalary());
        contract.setSignedAt(request.getSignedAt());
        contract.setNotes(request.getNotes());

        Contract updated = contractRepository.save(contract);
        log.info("Đã cập nhật hợp đồng số: {}", updated.getContractNumber());
        return convertToResponse(updated);
    }

    @Transactional
    public void deleteContract(Long contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng với ID: " + contractId));

        if (contract.getDocumentUrl() != null) {
            minioService.deleteFile(documentBucket, contract.getDocumentUrl());
        }

        contractRepository.delete(contract);
        log.info("Đã xóa hoàn toàn hợp đồng số: {}", contract.getContractNumber());
    }

    private String uploadContractDocument(String employeeCode, MultipartFile file) {
        String extension = getFileExtension(file.getOriginalFilename());
        String objectName = "contract_" + employeeCode + "_" + UUID.randomUUID() + extension;
        try {
            minioService.uploadFile(documentBucket, objectName, file.getInputStream(), file.getContentType());
            return objectName;
        } catch (IOException e) {
            throw new AppException("Lỗi đọc tệp tin tài liệu hợp đồng", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null) return "";
        int lastIndex = filename.lastIndexOf('.');
        return lastIndex == -1 ? "" : filename.substring(lastIndex);
    }

    private ContractResponse convertToResponse(Contract contract) {
        String documentPresignedUrl = null;
        if (contract.getDocumentUrl() != null) {
            // Presigned url xem hợp đồng có thời hạn 30 phút
            documentPresignedUrl = minioService.getPresignedUrl(documentBucket, contract.getDocumentUrl(), 30);
        }

        return ContractResponse.builder()
                .id(contract.getId())
                .employeeId(contract.getEmployee().getId())
                .employeeCode(contract.getEmployee().getEmployeeCode())
                .employeeName(contract.getEmployee().getFullName())
                .contractNumber(contract.getContractNumber())
                .contractType(contract.getContractType())
                .startDate(contract.getStartDate())
                .endDate(contract.getEndDate())
                .baseSalary(contract.getBaseSalary())
                .documentUrl(documentPresignedUrl != null ? documentPresignedUrl : contract.getDocumentUrl())
                .status(contract.getStatus())
                .signedAt(contract.getSignedAt())
                .notes(contract.getNotes())
                .build();
    }
}
