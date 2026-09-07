package com.taskflow.repository;

import com.taskflow.entity.ProjectTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectTaskRepository extends JpaRepository<ProjectTask, Long> {

    @Query("SELECT DISTINCT t FROM ProjectTask t JOIN FETCH t.createdBy LEFT JOIN FETCH t.assignee JOIN FETCH t.project LEFT JOIN FETCH t.labels WHERE t.project.id = :projectId AND t.archived = false ORDER BY t.position ASC")
    List<ProjectTask> findByProjectIdOrdered(@Param("projectId") Long projectId);

    @Query("SELECT DISTINCT t FROM ProjectTask t JOIN FETCH t.createdBy LEFT JOIN FETCH t.assignee JOIN FETCH t.project LEFT JOIN FETCH t.labels WHERE t.project.id = :projectId AND t.archived = false ORDER BY t.position ASC")
    Page<ProjectTask> findByProjectIdOrderedPaged(@Param("projectId") Long projectId, Pageable pageable);

    @Query("SELECT DISTINCT t FROM ProjectTask t JOIN FETCH t.createdBy LEFT JOIN FETCH t.assignee JOIN FETCH t.project LEFT JOIN FETCH t.labels WHERE t.project.id = :projectId AND t.status = :status AND t.archived = false ORDER BY t.position ASC")
    List<ProjectTask> findByProjectIdAndStatusOrdered(
            @Param("projectId") Long projectId,
            @Param("status") ProjectTask.TaskStatus status);

    long countByProjectIdAndStatusAndArchived(Long projectId, ProjectTask.TaskStatus status, boolean archived);
}
