package com.replast.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.beans.factory.annotation.Value;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@SpringBootApplication
public class RePlastApplication {
 public static void main(String[] args){ SpringApplication.run(RePlastApplication.class,args); }
 @Bean BCryptPasswordEncoder passwordEncoder(){ return new BCryptPasswordEncoder(); }
 @Bean CommandLineRunner seed(JdbcTemplate jdbc, BCryptPasswordEncoder encoder,
   @Value("${replast.admin-email}") String adminEmail,
   @Value("${replast.admin-password}") String adminPassword,
   @Value("${replast.upload-dir}") String uploadDir) {
  return args -> {
   Files.createDirectories(Path.of(uploadDir));
   Integer admins=jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE email=?",Integer.class,adminEmail.toLowerCase());
   if(admins==null||admins==0) jdbc.update("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,'admin')","RePlast Admin",adminEmail.toLowerCase(),encoder.encode(adminPassword));
   Integer count=jdbc.queryForObject("SELECT COUNT(*) FROM products",Integer.class);
   if(count==null||count==0){
    Object[][] products={{"Recycled Tote Bag",350,"Durable everyday bag made from recycled material.","👜",20},{"Bamboo Bottle",500,"Reusable insulated bottle for a greener routine.","🍶",15},{"Eco Notebook",220,"Recycled-paper notebook with a minimal design.","📓",30},{"Plantable Pencils",180,"Seed-tipped pencils that can be planted after use.","✏️",50},{"Recycled Planter",420,"Modern planter created from recovered plastic.","🪴",12},{"Eco Lunch Box",650,"Reusable lunch box designed to replace disposables.","🥡",10}};
    for(Object[] p:products) jdbc.update("INSERT INTO products(name,price,description,emoji,stock_quantity,stock_status) VALUES(?,?,?,?,?,?)",p[0],p[1],p[2],p[3],p[4],"IN_STOCK");
   }
  };
 }
 @Bean WebMvcConfigurer webMvcConfigurer(@Value("${replast.client-origin}") String origins,@Value("${replast.upload-dir}") String uploadDir){
  return new WebMvcConfigurer(){
   @Override public void addCorsMappings(CorsRegistry registry){registry.addMapping("/api/**").allowedOrigins(origins.split(",")).allowedMethods("GET","POST","PATCH","PUT","DELETE","OPTIONS").allowedHeaders("*");}
   @Override public void addResourceHandlers(ResourceHandlerRegistry registry){registry.addResourceHandler("/uploads/**").addResourceLocations(Path.of(uploadDir).toAbsolutePath().toUri().toString());}
  };
 }
}
