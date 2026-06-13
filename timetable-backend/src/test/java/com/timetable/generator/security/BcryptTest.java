package com.timetable.generator.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BcryptTest {

    @Test
    public void testBcryptMatch() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        String correctHash = encoder.encode("123456789");
        System.out.println("================");
        System.out.println("CORRECT HASH FOR 123456789: " + correctHash);
        System.out.println("================");
    }
}
