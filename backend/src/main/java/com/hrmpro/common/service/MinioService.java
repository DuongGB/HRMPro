package com.hrmpro.common.service;

import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioService {

    private final MinioClient minioClient;

    /**
     * Tải tệp lên MinIO bucket
     */
    public void uploadFile(String bucketName, String objectName, InputStream inputStream, String contentType) {
        try {
            // Kiểm tra bucket đã tồn tại chưa, nếu chưa thì tạo mới
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
                log.info("Đã tạo mới bucket: {}", bucketName);
            }

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(inputStream, inputStream.available(), -1)
                            .contentType(contentType)
                            .build()
            );
            log.info("Đã upload file lên MinIO: {}/{}", bucketName, objectName);
        } catch (Exception e) {
            log.error("Lỗi khi upload file lên MinIO: {}", e.getMessage());
            throw new RuntimeException("Lỗi lưu trữ tệp tin: " + e.getMessage(), e);
        }
    }

    /**
     * Tạo presigned URL có thời hạn cho phép client xem/tải tệp
     */
    public String getPresignedUrl(String bucketName, String objectName, int expiryInMinutes) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectName)
                            .expiry(expiryInMinutes, TimeUnit.MINUTES)
                            .build()
            );
        } catch (Exception e) {
            log.error("Lỗi khi tạo presigned URL từ MinIO: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Xóa tệp khỏi MinIO bucket
     */
    public void deleteFile(String bucketName, String objectName) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
            log.info("Đã xóa file khỏi MinIO: {}/{}", bucketName, objectName);
        } catch (Exception e) {
            log.error("Lỗi khi xóa file trên MinIO: {}", e.getMessage());
        }
    }
}
