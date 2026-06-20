package com.hrmpro.module.auth.service;

import com.hrmpro.module.auth.entity.Role;
import com.hrmpro.module.auth.entity.User;
import com.hrmpro.module.auth.entity.UserPrincipal;
import com.hrmpro.module.auth.enums.RoleType;
import com.hrmpro.module.auth.repository.UserRepository;
import com.hrmpro.util.TestFixtures;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CustomUserDetailsService Unit Tests")
class CustomUserDetailsServiceTest {

    @InjectMocks
    private CustomUserDetailsService service;

    @Mock
    private UserRepository userRepository;

    @Test
    @DisplayName("Tải user thành công — trả về UserPrincipal đúng")
    void loadUserByUsername_Success() {
        User user = TestFixtures.employeeUser();
        when(userRepository.findByUsername("employee1")).thenReturn(Optional.of(user));

        UserDetails result = service.loadUserByUsername("employee1");

        assertThat(result).isInstanceOf(UserPrincipal.class);
        assertThat(result.getUsername()).isEqualTo("employee1");
        assertThat(result.getAuthorities()).isNotEmpty();
        assertThat(result.isAccountNonLocked()).isTrue();
    }

    @Test
    @DisplayName("User không tồn tại → UsernameNotFoundException")
    void loadUserByUsername_UserNotFound() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserByUsername("unknown"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("Không tìm thấy");
    }

    @Test
    @DisplayName("User bị khóa → UsernameNotFoundException")
    void loadUserByUsername_UserInactive() {
        User user = TestFixtures.employeeUser();
        user.setIsActive(false);
        when(userRepository.findByUsername("employee1")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.loadUserByUsername("employee1"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("bị khóa");
    }

    @Test
    @DisplayName("User có nhiều roles → authorities chứa tất cả roles")
    void loadUserByUsername_MultipleRoles() {
        User user = TestFixtures.adminUser();
        user.getRoles().add(TestFixtures.hrAdminRole());
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

        UserDetails result = service.loadUserByUsername("admin");

        assertThat(result.getAuthorities()).hasSizeGreaterThanOrEqualTo(2);
    }
}
