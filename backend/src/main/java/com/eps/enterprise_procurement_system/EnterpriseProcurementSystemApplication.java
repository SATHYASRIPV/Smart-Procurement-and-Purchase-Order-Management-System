package com.eps.enterprise_procurement_system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class EnterpriseProcurementSystemApplication {

	public static void main(String[] args) {
		Dotenv denv = Dotenv.configure().directory("./backend").ignoreIfMalformed().ignoreIfMissing().load();
		denv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));
		SpringApplication.run(EnterpriseProcurementSystemApplication.class, args);
	}

}
