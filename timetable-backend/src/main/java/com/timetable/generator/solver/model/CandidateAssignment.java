package com.timetable.generator.solver.model;

import lombok.*;
import java.util.List;

/**
 * A candidate assignment for a SessionVariable.
 * Represents: "schedule this session on [day], starting at slots [slotChain], in room [roomId]."
 * 
 * For blockSize=1: slotChain has 1 element.
 * For blockSize=3: slotChain has 3 consecutive slot IDs.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateAssignment {

    private String day;                 // e.g. 'MONDAY'
    private List<Long> slotChain;       // Ordered consecutive slot template IDs
    private Long roomId;
    private String roomType;
    private int roomCapacity;
    private double penaltyCost;         // Computed by PenaltyCalculator (lower = better)

    /** The primary slot ID (first in chain) — used for clash checking lookups. */
    public Long primarySlotId() {
        return slotChain.get(0);
    }

    /** The last slot ID in the chain — for consecutive block validation. */
    public Long lastSlotId() {
        return slotChain.get(slotChain.size() - 1);
    }
}
