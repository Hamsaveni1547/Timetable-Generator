package com.timetable.generator.repository.academic;

import com.timetable.generator.entity.academic.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByIsActiveTrue();

    List<Room> findByRoomTypeAndIsActiveTrue(String roomType);

    Optional<Room> findFirstByNameIgnoreCase(String name);

    Optional<Room> findFirstByNameIgnoreCaseAndIsActiveTrue(String name);

    /**
     * Returns distinct room types for dynamic dropdown — no hardcoded type list in
     * UI.
     */
    @Query("SELECT DISTINCT r.roomType FROM Room r WHERE r.isActive = true ORDER BY r.roomType")
    List<String> findDistinctActiveRoomTypes();

    /** Rooms that can accommodate a specific student count. */
    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.capacity >= :minCapacity")
    List<Room> findByMinCapacity(int minCapacity);

    /** Used by solver to get eligible rooms for a subject. */
    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.roomType = :roomType AND r.capacity >= :minCapacity")
    List<Room> findEligibleRooms(String roomType, int minCapacity);
}
