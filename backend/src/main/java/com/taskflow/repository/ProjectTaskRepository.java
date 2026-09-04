package com.taskflow.repository;

import com.taskflow.entity.ProjectTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectTaskRepository extends JpaRepository<ProjectTask, Long> {

    @Query("SELECT t FROM ProjectTask t WHERE t.project.id = :projectId ORDER BY t.position ASC")
    List<ProjectTask> findByProjectIdOrdered(@Param("projectId") Long projectId);

    @Query("SELECT t FROM ProjectTask t WHERE t.project.id = :projectId AND t.status = :status ORDER BY t.position ASC")
    List<ProjectTask> findByProjectIdAndStatusOrdered(
            @Param("projectId") Long projectId,
            @Param("status") ProjectTask.TaskStatus status);

    long countByProjectIdAndStatus(Long projectId, ProjectTask.TaskStatus status);
}
