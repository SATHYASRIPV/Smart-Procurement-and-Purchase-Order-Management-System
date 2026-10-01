package com.eps.enterprise_procurement_system.controllers;

import com.eps.enterprise_procurement_system.advices.ApiResponse;
import com.eps.enterprise_procurement_system.dto.LoginRequestDTO;
import com.eps.enterprise_procurement_system.dto.LoginResponseDTO;
import com.eps.enterprise_procurement_system.dto.RegisterRequestDTO;
import com.eps.enterprise_procurement_system.dto.RegisterResponseDTO;
import com.eps.enterprise_procurement_system.services.AuthService;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponseDTO>> register(@Valid @RequestBody RegisterRequestDTO dto){
           RegisterResponseDTO  response = authService.register(dto);

            return ResponseEntity.ok(new ApiResponse<>(response));
    }

    @PostMapping("/login")
    public  ResponseEntity<ApiResponse<LoginResponseDTO>> login(@Valid @RequestBody LoginRequestDTO dto, HttpSession session){

        LoginResponseDTO s = authService.login(dto, session);

        return ResponseEntity.ok(new ApiResponse<>(s));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponseDTO>> refreshToken(@Valid @RequestBody com.eps.enterprise_procurement_system.dto.RefreshTokenRequestDTO dto) {
        LoginResponseDTO response = authService.refreshToken(dto);
        return ResponseEntity.ok(new ApiResponse<>(response));
    }
}
