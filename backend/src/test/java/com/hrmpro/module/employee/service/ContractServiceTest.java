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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ContractService Unit Tests")
class ContractServiceTest {

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private MinioService minioService;

    @InjectMocks
    private ContractService contractService;

    private Employee employee;
    private Contract contract;
    private ContractRequest request;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(contractService, "documentBucket", "test-bucket");

        employee = Employee.builder()
                .id(1L)
                .employeeCode("EMP001")
                .firstName("John")
                .lastName("Doe")
                .build();

        contract = Contract.builder()
                .id(10L)
                .employee(employee)
                .contractNumber("HD-001")
                .contractType("INDEFINITE")
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(null)
                .baseSalary(BigDecimal.valueOf(20000000))
                .documentUrl("contract_file.pdf")
                .status("ACTIVE")
                .build();

        request = ContractRequest.builder()
                .contractNumber("HD-001")
                .contractType("INDEFINITE")
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(null)
                .baseSalary(BigDecimal.valueOf(20000000))
                .signedAt(LocalDate.of(2025, 12, 25))
                .notes("Hợp đồng vô thời hạn")
                .build();
    }

    @Test
    @DisplayName("getContractsByEmployee — thành công → trả về danh sách")
    void getContractsByEmployee_Success() {
        when(employeeRepository.existsById(1L)).thenReturn(true);
        when(contractRepository.findByEmployeeId(1L)).thenReturn(List.of(contract));
        when(minioService.getPresignedUrl(eq("test-bucket"), eq("contract_file.pdf"), anyInt()))
                .thenReturn("http://presigned-url/contract_file.pdf");

        List<ContractResponse> responses = contractService.getContractsByEmployee(1L);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getContractNumber()).isEqualTo("HD-001");
        assertThat(responses.get(0).getDocumentUrl()).isEqualTo("http://presigned-url/contract_file.pdf");
    }

    @Test
    @DisplayName("getContractsByEmployee — không tìm thấy nhân viên → ném ResourceNotFoundException")
    void getContractsByEmployee_EmployeeNotFound() {
        when(employeeRepository.existsById(1L)).thenReturn(false);

        assertThatThrownBy(() -> contractService.getContractsByEmployee(1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy nhân viên");
    }

    @Test
    @DisplayName("getContract — thành công → trả về chi tiết")
    void getContract_Success() {
        when(contractRepository.findById(10L)).thenReturn(Optional.of(contract));
        when(minioService.getPresignedUrl(eq("test-bucket"), eq("contract_file.pdf"), anyInt()))
                .thenReturn("http://presigned-url/contract_file.pdf");

        ContractResponse response = contractService.getContract(10L);

        assertThat(response).isNotNull();
        assertThat(response.getContractNumber()).isEqualTo("HD-001");
    }

    @Test
    @DisplayName("getContract — không tìm thấy hợp đồng → ném ResourceNotFoundException")
    void getContract_NotFound() {
        when(contractRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contractService.getContract(10L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy hợp đồng");
    }

    @Test
    @DisplayName("createContract — không có file tài liệu → thành công")
    void createContract_WithoutFile_Success() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(contractRepository.existsByContractNumber("HD-001")).thenReturn(false);
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> {
            Contract c = invocation.getArgument(0);
            c.setId(10L);
            return c;
        });

        ContractResponse response = contractService.createContract(1L, request, null);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getDocumentUrl()).isNull();
        verify(contractRepository).save(any(Contract.class));
    }

    @Test
    @DisplayName("createContract — có file tài liệu → thành công")
    void createContract_WithFile_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "my-contract.pdf", "application/pdf", "dummy content".getBytes());

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(contractRepository.existsByContractNumber("HD-001")).thenReturn(false);
        doNothing().when(minioService).uploadFile(eq("test-bucket"), anyString(), any(InputStream.class), eq("application/pdf"));
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> {
            Contract c = invocation.getArgument(0);
            c.setId(10L);
            return c;
        });

        ContractResponse response = contractService.createContract(1L, request, file);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getDocumentUrl()).isNotNull(); // Tên file tài liệu upload
        verify(minioService).uploadFile(eq("test-bucket"), anyString(), any(InputStream.class), eq("application/pdf"));
    }

    @Test
    @DisplayName("createContract — trùng số hợp đồng → ném AppException")
    void createContract_DuplicateContractNumber() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(contractRepository.existsByContractNumber("HD-001")).thenReturn(true);

        assertThatThrownBy(() -> contractService.createContract(1L, request, null))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("đã tồn tại");
    }

    @Test
    @DisplayName("updateContract — không đổi file tài liệu → thành công")
    void updateContract_WithoutNewFile_Success() {
        when(contractRepository.findById(10L)).thenReturn(Optional.of(contract));
        when(contractRepository.save(any(Contract.class))).thenReturn(contract);

        ContractResponse response = contractService.updateContract(10L, request, null);

        assertThat(response).isNotNull();
        assertThat(response.getContractNumber()).isEqualTo("HD-001");
        verify(minioService, never()).deleteFile(anyString(), anyString());
        verify(minioService, never()).uploadFile(anyString(), anyString(), any(), anyString());
    }

    @Test
    @DisplayName("updateContract — có file tài liệu mới → xóa file cũ, upload file mới")
    void updateContract_WithNewFile_Success() throws Exception {
        MockMultipartFile newFile = new MockMultipartFile("file", "new-contract.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "new content".getBytes());

        when(contractRepository.findById(10L)).thenReturn(Optional.of(contract));
        doNothing().when(minioService).deleteFile("test-bucket", "contract_file.pdf");

        doNothing().when(minioService).uploadFile(eq("test-bucket"), anyString(), any(InputStream.class), eq("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
        when(contractRepository.save(any(Contract.class))).thenReturn(contract);

        ContractResponse response = contractService.updateContract(10L, request, newFile);

        assertThat(response).isNotNull();
        verify(minioService).deleteFile("test-bucket", "contract_file.pdf");
        verify(minioService).uploadFile(eq("test-bucket"), anyString(), any(InputStream.class), eq("application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
    }

    @Test
    @DisplayName("updateContract — trùng số hợp đồng của hợp đồng khác → ném AppException")
    void updateContract_DuplicateContractNumber() {
        ContractRequest otherRequest = ContractRequest.builder()
                .contractNumber("HD-002") // Đổi số hợp đồng
                .build();

        when(contractRepository.findById(10L)).thenReturn(Optional.of(contract));
        when(contractRepository.existsByContractNumber("HD-002")).thenReturn(true); // Số này đã có ở hợp đồng khác

        assertThatThrownBy(() -> contractService.updateContract(10L, otherRequest, null))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("đã tồn tại ở hợp đồng khác");
    }

    @Test
    @DisplayName("deleteContract — thành công → xóa tài liệu trên MinIO và xóa entity")
    void deleteContract_Success() {
        when(contractRepository.findById(10L)).thenReturn(Optional.of(contract));
        doNothing().when(minioService).deleteFile("test-bucket", "contract_file.pdf");
        doNothing().when(contractRepository).delete(contract);

        contractService.deleteContract(10L);

        verify(minioService).deleteFile("test-bucket", "contract_file.pdf");
        verify(contractRepository).delete(contract);
    }
}
