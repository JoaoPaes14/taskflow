package com.taskflow.repository;

import com.taskflow.entity.TaskComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskCommentRepository extends JpaRepository<TaskComment, Long> {

    @Query("SELECT DISTINCT c FROM TaskComment c JOIN FETCH c.author JOIN FETCH c.task WHERE c.task.id = :taskId ORDER BY c.createdAt ASC")
    List<TaskComment> findByTaskIdOrderByCreatedAtAsc(@Param("taskId") Long taskId);
}