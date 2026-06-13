ALTER TABLE sections
    ADD COLUMN room_id BIGINT NULL AFTER department_id;

ALTER TABLE sections
    ADD CONSTRAINT fk_section_room FOREIGN KEY (room_id)
        REFERENCES rooms(id) ON DELETE SET NULL;