package com.taskflow.repository;

import com.taskflow.entity.TaskLabel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskLabelRepository extends JpaRepository<TaskLabel, Long> {
    List<TaskLabel> findByProjectIdOrderByName(Long projectId);
    Optional<TaskLabel> findByProjectIdAndName(Long projectId, String name);
    boolean existsByProjectIdAndName(Long projectId, String name);
}
