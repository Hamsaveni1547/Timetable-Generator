package com.timetable.generator.exception;

import com.timetable.generator.solver.model.BottleneckReport;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown by the solver when no valid timetable can be generated.
 * Carries a detailed BottleneckReport describing which constraints
 * caused the failure and what remedial actions are suggested.
 */
@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class SchedulingConstraintException extends RuntimeException {

    private final BottleneckReport bottleneckReport;

    public SchedulingConstraintException(String message, BottleneckReport bottleneckReport) {
        super(message);
        this.bottleneckReport = bottleneckReport;
    }

    public BottleneckReport getBottleneckReport() {
        return bottleneckReport;
    }
}
