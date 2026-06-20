package com.hrmpro.common.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hrmpro.module.auth.entity.AuditLog;
import com.hrmpro.module.auth.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLogAspect {

    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    @Around("within(@org.springframework.web.bind.annotation.RestController *)")
    public Object logAudit(ProceedingJoinPoint joinPoint) throws Throwable {
        HttpServletRequest request = getCurrentRequest();
        if (request == null) {
            return joinPoint.proceed();
        }

        String method = request.getMethod();
        // Chỉ tự động ghi log với các request thay đổi dữ liệu (POST, PUT, DELETE) hoặc có đánh dấu annotation
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method targetMethod = signature.getMethod();
        AuditLogAction auditLogAction = targetMethod.getAnnotation(AuditLogAction.class);

        boolean isWriteRequest = method.equalsIgnoreCase("POST") || 
                                 method.equalsIgnoreCase("PUT") || 
                                 method.equalsIgnoreCase("DELETE");

        if (auditLogAction == null && !isWriteRequest) {
            return joinPoint.proceed();
        }

        String username = getUsernameFromContext();
        String requestUri = request.getRequestURI();
        String ipAddress = getClientIp(request);
        String actionName = auditLogAction != null ? auditLogAction.value() : getActionNameFromMethod(method, requestUri);
        String payload = getPayload(joinPoint);

        Object result = null;
        int status = 200;
        long startTime = System.currentTimeMillis();

        try {
            result = joinPoint.proceed();
            
            if (result instanceof ResponseEntity) {
                status = ((ResponseEntity<?>) result).getStatusCode().value();
            }
            return result;
        } catch (Throwable throwable) {
            status = 500;
            payload = payload + " [Error: " + throwable.getMessage() + "]";
            throw throwable;
        } finally {
            try {
                // Tạo và lưu audit log bất đồng bộ hoặc chạy trực tiếp nhưng bọc try-catch để không làm treo luồng chính
                AuditLog auditLog = AuditLog.builder()
                        .username(username)
                        .action(actionName)
                        .method(method)
                        .requestUri(requestUri)
                        .ipAddress(ipAddress)
                        .status(status)
                        .payload(payload)
                        .createdAt(LocalDateTime.now())
                        .build();

                auditLogService.saveAuditLog(auditLog);
            } catch (Exception e) {
                log.error("Không thể ghi audit log vào cơ sở dữ liệu: {}", e.getMessage());
            }
        }
    }

    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }

    private String getUsernameFromContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            return authentication.getName();
        }
        return "ANONYMOUS";
    }

    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = "";
        if (request != null) {
            remoteAddr = request.getHeader("X-FORWARDED-FOR");
            if (remoteAddr == null || "".equals(remoteAddr)) {
                remoteAddr = request.getRemoteAddr();
            }
        }
        return remoteAddr;
    }

    private String getActionNameFromMethod(String httpMethod, String uri) {
        if (uri.startsWith("/api/v1/auth/login")) return "Đăng nhập hệ thống";
        if (uri.startsWith("/api/v1/auth/logout")) return "Đăng xuất hệ thống";
        
        switch (httpMethod.toUpperCase()) {
            case "POST": return "Thêm mới dữ liệu: " + uri;
            case "PUT": return "Cập nhật dữ liệu: " + uri;
            case "DELETE": return "Xóa dữ liệu: " + uri;
            default: return "Thao tác trên API: " + uri;
        }
    }

    private String getPayload(ProceedingJoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            String[] parameterNames = signature.getParameterNames();
            
            if (args == null || args.length == 0) {
                return "";
            }

            Map<String, Object> params = new HashMap<>();
            for (int i = 0; i < args.length; i++) {
                String name = parameterNames[i];
                Object value = args[i];
                
                // Bỏ qua các đối tượng Servlet/Response/MultipartFile
                if (value instanceof HttpServletRequest || 
                    value instanceof jakarta.servlet.http.HttpServletResponse ||
                    value instanceof org.springframework.web.multipart.MultipartFile ||
                    value instanceof org.springframework.validation.BindingResult) {
                    continue;
                }
                
                params.put(name, value);
            }

            String json = objectMapper.writeValueAsString(params);
            
            // Mask các thông tin mật khẩu nhạy cảm
            ObjectNode node = (ObjectNode) objectMapper.readTree(json);
            maskSensitiveFields(node);
            
            String result = objectMapper.writeValueAsString(node);
            if (result.length() > 2000) {
                return result.substring(0, 1997) + "...";
            }
            return result;
        } catch (Exception e) {
            return "[Không thể phân tích payload: " + e.getMessage() + "]";
        }
    }

    private void maskSensitiveFields(ObjectNode node) {
        String[] sensitiveFields = {"password", "newPassword", "oldPassword", "newpassword", "oldpassword", "token", "refreshToken", "accessToken"};
        
        // Duyệt đệ quy để tìm các trường nhạy cảm
        node.fieldNames().forEachRemaining(fieldName -> {
            if (node.get(fieldName).isObject()) {
                maskSensitiveFields((ObjectNode) node.get(fieldName));
            } else {
                for (String sensitive : sensitiveFields) {
                    if (fieldName.equalsIgnoreCase(sensitive)) {
                        node.put(fieldName, "******");
                    }
                }
            }
        });
    }
}
