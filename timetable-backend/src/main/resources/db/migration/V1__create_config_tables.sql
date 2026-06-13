-- =====================================================================
-- V1: Configuration Tables (The Dynamic Layer)
-- All scheduling rules, slot definitions, and constraint weights live here.
-- No hardcoded scheduling constants exist in application code.
-- =====================================================================

-- 1. schedule_config: Key-value store for global schedule parameters
CREATE TABLE schedule_config (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_key  VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    description VARCHAR(255),
    updated_by  BIGINT NULL,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 2. slot_templates: Every teaching/break period definition
--    is_break=TRUE rows are stored for UI display; solver ignores them.
--    applies_to_days: comma-separated day names or 'ALL'
CREATE TABLE slot_templates (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    slot_number      INT NOT NULL,
    label            VARCHAR(50) NOT NULL,
    start_time       TIME NOT NULL,
    end_time         TIME NOT NULL,
    is_break         BOOLEAN NOT NULL DEFAULT FALSE,
    applies_to_days  VARCHAR(100) NOT NULL DEFAULT 'ALL',
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_slot_number_days (slot_number, applies_to_days)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 3. constraint_config: Named constraint definitions with toggleable weights
--    HC_* (is_hard=1): violation means the assignment is REJECTED outright
--    SC_* (is_hard=0): violation adds penalty_weight to the cost function
CREATE TABLE constraint_config (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    constraint_key  VARCHAR(100) NOT NULL,
    is_hard         BOOLEAN NOT NULL DEFAULT FALSE,
    penalty_weight  DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    description     VARCHAR(500),
    updated_by      BIGINT NULL,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_constraint_key (constraint_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
