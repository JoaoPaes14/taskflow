package com.taskflow.repository;

import com.taskflow.entity.ProjectTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
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

    long countByProjectIdAndArchived(Long projectId, boolean archived);

    @Query("SELECT t.assignee.name, COUNT(t) FROM ProjectTask t WHERE t.project.id = :projectId AND t.archived = false AND t.assignee IS NOT NULL GROUP BY t.assignee.name")
    List<Object[]> countByAssignee(@Param("projectId") Long projectId);

    @Query("SELECT CAST(t.priority AS string), COUNT(t) FROM ProjectTask t WHERE t.project.id = :projectId AND t.archived = false GROUP BY t.priority")
    List<Object[]> countByPriority(@Param("projectId") Long projectId);

    @Query("SELECT t FROM ProjectTask t JOIN FETCH t.assignee JOIN FETCH t.project WHERE t.archived = false AND t.status <> 'DONE' AND t.dueDate = :date")
    List<ProjectTask> findTasksDueOnDate(@Param("date") LocalDate date);

    @Query("SELECT t FROM ProjectTask t JOIN FETCH t.assignee JOIN FETCH t.project WHERE t.archived = false AND t.status <> 'DONE' AND t.dueDate BETWEEN :start AND :end")
    List<ProjectTask> findTasksDueBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query(value = "SELECT * FROM project_tasks t WHERE t.project_id = :projectId AND t.archived = false AND MATCH(t.title, t.description) AGAINST (:query IN NATURAL LANGUAGE MODE) ORDER BY t.position ASC", nativeQuery = true)
    List<ProjectTask> searchByFullText(@Param("projectId") Long projectId, @Param("query") String query);

    @Query("SELECT t FROM ProjectTask t WHERE t.status = 'DONE' AND t.recurrence <> 'NONE' AND t.nextRecurrenceDate <= :date")
    List<ProjectTask> findCompletedRecurringTasks(@Param("date") LocalDate date);
}
