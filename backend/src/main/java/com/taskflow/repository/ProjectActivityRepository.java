package com.taskflow.repository;

import com.taskflow.entity.ProjectActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectActivityRepository extends JpaRepository<ProjectActivity, Long> {

    @Query("SELECT DISTINCT pa FROM ProjectActivity pa JOIN FETCH pa.actor JOIN FETCH pa.project WHERE pa.project.id = :projectId ORDER BY pa.createdAt DESC")
    List<ProjectActivity> findByProjectIdOrderByCreatedAtDesc(@Param("projectId") Long projectId);

    @Query("SELECT DISTINCT pa FROM ProjectActivity pa JOIN FETCH pa.actor JOIN FETCH pa.project WHERE pa.project.id = :projectId ORDER BY pa.createdAt DESC")
    Page<ProjectActivity> findByProjectIdOrderByCreatedAtDescPaged(@Param("projectId") Long projectId, Pageable pageable);
}
