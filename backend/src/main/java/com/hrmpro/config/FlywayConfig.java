package com.hrmpro.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy repairStrategy() {
        return flyway -> {
            // Tự động đồng bộ lại checksum nếu file migration bị thay đổi format (CRLF vs LF)
            flyway.repair();
            flyway.migrate();
        };
    }
}
