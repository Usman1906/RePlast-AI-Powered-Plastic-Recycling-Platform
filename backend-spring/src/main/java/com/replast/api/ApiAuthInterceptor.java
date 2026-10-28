package com.replast.api;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
public class ApiAuthInterceptor implements HandlerInterceptor {
 private final JdbcTemplate jdbc; private final SecretKey key;
 public ApiAuthInterceptor(JdbcTemplate jdbc,@Value("${replast.jwt-secret}") String secret){this.jdbc=jdbc;this.key=Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));}
 @Override public boolean preHandle(HttpServletRequest req,HttpServletResponse res,Object handler)throws Exception{
  String path=req.getRequestURI(); if(!path.startsWith("/api/")||path.equals("/api/health")||path.equals("/api/products")||path.equals("/api/auth/login")||path.equals("/api/auth/signup"))return true;
  String header=req.getHeader("Authorization"); if(header==null||!header.startsWith("Bearer ")){res.setStatus(401);res.setContentType("application/json");res.getWriter().write("{\"message\":\"Authentication required.\"}");return false;}
  try{Claims claims=Jwts.parser().verifyWith(key).build().parseSignedClaims(header.substring(7)).getPayload();long id=Long.parseLong(claims.getSubject());Map<String,Object> user=jdbc.queryForMap("SELECT id,name,email,phone,role,points,recycled_kg,is_active,created_at FROM users WHERE id=?",id);Object active=user.get("is_active");boolean enabled=Boolean.TRUE.equals(active)||(active instanceof Number n&&n.intValue()!=0);if(!enabled){res.setStatus(401);return false;}req.setAttribute("authUser",user);return true;}
  catch(Exception e){res.setStatus(401);res.setContentType("application/json");res.getWriter().write("{\"message\":\"Session expired. Please sign in again.\"}");return false;}
 }
}
