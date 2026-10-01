package com.eps.enterprise_procurement_system.services;


import com.eps.enterprise_procurement_system.dto.LoginRequestDTO;
import com.eps.enterprise_procurement_system.dto.LoginResponseDTO;
import com.eps.enterprise_procurement_system.dto.RegisterRequestDTO;
import com.eps.enterprise_procurement_system.dto.RegisterResponseDTO;
import com.eps.enterprise_procurement_system.entities.Department;
import com.eps.enterprise_procurement_system.entities.Supplier;
import com.eps.enterprise_procurement_system.entities.User;
import com.eps.enterprise_procurement_system.entities.enums.Role;
import com.eps.enterprise_procurement_system.repositories.DepartmentRepo;
import com.eps.enterprise_procurement_system.repositories.ProductCategoryRepo;
import com.eps.enterprise_procurement_system.repositories.SupplierRepo;
import com.eps.enterprise_procurement_system.repositories.UserRepository;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final ModelMapper modelMapper;
    private final UserRepository userRepository;
    private final DepartmentRepo departmentRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final ProductCategoryRepo categoryRepo;
    private final SupplierRepo supplierRepo;


    public RegisterResponseDTO register(RegisterRequestDTO dto){

        Department dept = dto.getDepartmentId() != null
                ? departmentRepo.findById(dto.getDepartmentId()).orElse(null) : null;

        User user1 = userRepository.findByEmail(dto.getEmail());
        if (user1!=null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User with email already present");
        }
        
        User user = User.builder()
            .fullName(dto.getFullName())
            .email(dto.getEmail())
            .password(passwordEncoder.encode(dto.getPassword()))
            .role(dto.getRole())
            .department(dept)
            .isActive(true)
            .build();
        User saved = userRepository.save(user);

        if (dto.getRole() == Role.SUPPLIER) {

            Supplier supplier = Supplier.builder()
                    .user(user)
                    .companyName(dto.getCompanyName())
                    .phone(dto.getPhone())
                    .address(dto.getAddress())
                    .category(categoryRepo.findById(dto.getCategoryId()).orElseThrow())
                    .build();

            supplierRepo.save(supplier);
        }
       
        RegisterResponseDTO responseDTO =
                 RegisterResponseDTO.builder()
                        .accesToken(jwtService.generateAccessToken(saved))
                        .refreshToken(jwtService.generateRefreshToken(saved))
                        .message("Register Succesfully")
                        .build();

         return responseDTO;

    }

    public  LoginResponseDTO login(LoginRequestDTO dto, HttpSession session) {

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getPassword())
             );

            User user = (User) authentication.getPrincipal();
            if (user.getIsActive() != null && !user.getIsActive()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account is deactivated by admin");
            }

            String accessToken = jwtService.generateAccessToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);

            session.setAttribute("userId", user.getId());
            session.setAttribute("userEmail", user.getEmail());
            session.setAttribute("accessToken", accessToken);

            LoginResponseDTO responseDTO = LoginResponseDTO.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                    .message("Login Successful")
                    .role(user.getRole())
                    .fullName(user.getFullName())
                .build();
            return responseDTO;
            
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Invalid Email or password");
        }
    }

    public LoginResponseDTO refreshToken(com.eps.enterprise_procurement_system.dto.RefreshTokenRequestDTO dto) {
        try {
            Long userId = jwtService.getUserIdFromToken(dto.getRefreshToken());
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
            
            if (user.getIsActive() != null && !user.getIsActive()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account is deactivated by admin");
            }

            String newAccessToken = jwtService.generateAccessToken(user);
            String newRefreshToken = jwtService.generateRefreshToken(user);

            return LoginResponseDTO.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(newRefreshToken)
                    .message("Token refreshed successfully")
                    .role(user.getRole())
                    .fullName(user.getFullName())
                    .build();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }
    }
}
