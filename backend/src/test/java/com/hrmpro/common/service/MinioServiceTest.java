package com.hrmpro.common.service;

import io.minio.*;
import io.minio.http.Method;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MinioService Unit Tests")
class MinioServiceTest {

    @InjectMocks private MinioService minioService;
    @Mock private MinioClient minioClient;

    @Nested
    @DisplayName("uploadFile")
    class UploadFile {

        @Test
        @DisplayName("Upload thành công — bucket đã tồn tại")
        void uploadFile_BucketExists_Success() throws Exception {
            InputStream inputStream = new ByteArrayInputStream("file-data".getBytes());
            when(minioClient.bucketExists(any(BucketExistsArgs.class))).thenReturn(true);

            assertThatCode(() -> minioService.uploadFile("my-bucket", "file.txt", inputStream, "text/plain"))
                    .doesNotThrowAnyException();

            verify(minioClient).putObject(any(PutObjectArgs.class));
            verify(minioClient, never()).makeBucket(any(MakeBucketArgs.class));
        }

        @Test
        @DisplayName("Upload thành công — tạo bucket mới nếu chưa tồn tại")
        void uploadFile_CreatesBucketIfNotExists() throws Exception {
            InputStream inputStream = new ByteArrayInputStream("file-data".getBytes());
            when(minioClient.bucketExists(any(BucketExistsArgs.class))).thenReturn(false);

            minioService.uploadFile("new-bucket", "file.txt", inputStream, "text/plain");

            verify(minioClient).makeBucket(any(MakeBucketArgs.class));
            verify(minioClient).putObject(any(PutObjectArgs.class));
        }

        @Test
        @DisplayName("Upload lỗi → RuntimeException")
        void uploadFile_Error_ThrowsRuntimeException() throws Exception {
            InputStream inputStream = new ByteArrayInputStream("data".getBytes());
            when(minioClient.bucketExists(any(BucketExistsArgs.class)))
                    .thenThrow(new RuntimeException("Connection refused"));

            assertThatThrownBy(() -> minioService.uploadFile("bucket", "file.txt", inputStream, "text/plain"))
                    .isInstanceOf(RuntimeException.class);
        }
    }

    @Nested
    @DisplayName("getPresignedUrl")
    class GetPresignedUrl {

        @Test
        @DisplayName("Tạo presigned URL thành công")
        void getPresignedUrl_Success() throws Exception {
            when(minioClient.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                    .thenReturn("https://minio.local/presigned-url");

            String result = minioService.getPresignedUrl("bucket", "file.txt", 15);

            assertThat(result).isEqualTo("https://minio.local/presigned-url");
        }

        @Test
        @DisplayName("Lỗi khi tạo presigned URL → trả null")
        void getPresignedUrl_Error_ReturnsNull() throws Exception {
            when(minioClient.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                    .thenThrow(new RuntimeException("Error"));

            String result = minioService.getPresignedUrl("bucket", "file.txt", 15);

            assertThat(result).isNull();
        }
    }

    @Nested
    @DisplayName("deleteFile")
    class DeleteFile {

        @Test
        @DisplayName("Xóa file thành công")
        void deleteFile_Success() throws Exception {
            minioService.deleteFile("bucket", "file.txt");

            verify(minioClient).removeObject(any(RemoveObjectArgs.class));
        }

        @Test
        @DisplayName("Xóa file lỗi → không throw exception")
        void deleteFile_Error_DoesNotThrow() throws Exception {
            doThrow(new RuntimeException("Error")).when(minioClient).removeObject(any(RemoveObjectArgs.class));

            assertThatCode(() -> minioService.deleteFile("bucket", "file.txt"))
                    .doesNotThrowAnyException();
        }
    }
}
