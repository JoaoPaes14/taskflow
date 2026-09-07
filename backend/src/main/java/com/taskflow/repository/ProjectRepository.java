package com.taskflow.repository;

import com.taskflow.entity.Project;
import com.taskflow.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("SELECT DISTINCT p FROM Project p JOIN p.members pm LEFT JOIN FETCH p.createdBy WHERE pm.user = :user AND p.status != 'DELETED'")
    List<Project> findByMember(@Param("user") User user);

    @Query("SELECT DISTINCT p FROM Project p JOIN p.members pm LEFT JOIN FETCH p.createdBy WHERE pm.user = :user AND p.status != 'DELETED'")
    Page<Project> findByMemberPaged(@Param("user") User user, Pageable pageable);

    @Query("SELECT p FROM Project p WHERE p.id = :id AND p.status != 'DELETED'")
    Optional<Project> findActiveById(@Param("id") Long id);

    @Query("SELECT COUNT(pm) > 0 FROM ProjectMember pm WHERE pm.project.id = :projectId AND pm.user.id = :userId")
    boolean isUserMember(@Param("projectId") Long projectId, @Param("userId") Long userId);
}
