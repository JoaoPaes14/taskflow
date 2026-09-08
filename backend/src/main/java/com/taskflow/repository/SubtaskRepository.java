package com.taskflow.repository;

import com.taskflow.entity.Subtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubtaskRepository extends JpaRepository<Subtask, Long> {
    List<Subtask> findByTaskIdOrderByPositionAsc(Long taskId);
    long countByTaskId(Long taskId);
}
