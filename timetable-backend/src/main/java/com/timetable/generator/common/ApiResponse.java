package com.timetable.generator.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Standard API response envelope for all endpoints.
 * Success: { "success": true, "data": {...}, "message": "..." }
 * Error:   { "success": false, "error": "CODE", "details": [...] }
 */
@Getter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private String message;
    private String error;
    private Object details;
    private LocalDateTime timestamp;

    private ApiResponse(boolean success, T data, String message, String error, Object details) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.error = error;
        this.details = details;
        this.timestamp = LocalDateTime.now();
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, data, message, null, null);
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, "Success", null, null);
    }

    public static <T> ApiResponse<T> error(String errorCode, String message) {
        return new ApiResponse<>(false, null, message, errorCode, null);
    }

    public static <T> ApiResponse<T> error(String errorCode, String message, Object details) {
        return new ApiResponse<>(false, null, message, errorCode, details);
    }
}
