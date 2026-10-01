package com.eps.enterprise_procurement_system.services;

import com.eps.enterprise_procurement_system.entities.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    @Value("${jwt.secret_key}")
    private String secret_key;

    public SecretKey getSecretKey() {
        return Keys.hmacShaKeyFor(secret_key.getBytes(StandardCharsets.UTF_8));
    }

    public String generateRefreshToken(User user) {
        return Jwts.builder()
                .subject(user.getId().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 7L * 24 * 60 * 60 * 1000))
                .signWith(getSecretKey())
                .compact();
    }

    public String generateAccessToken(User user){
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("email",user.getEmail())
                .claim("role",user.getRole())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 15*60*1000))
                .signWith(getSecretKey())
                .compact();
    }

   public long getUserIdFromToken(String token){
       Claims claims = Jwts.parser()
               .verifyWith(getSecretKey())
               .build()
               .parseSignedClaims(token)
               .getPayload();

       return Long.valueOf(claims.getSubject());
   }
}
