package com.taskflow.util;

import com.taskflow.dto.ProjectTaskDTO;

import java.util.List;

public final class CsvExportUtil {

    private CsvExportUtil() {
    }

    public static String toCsv(List<ProjectTaskDTO> tasks) {
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Titulo,Descricao,Status,Prioridade,Data Limite,Responsavel,Criado em\n");
        for (ProjectTaskDTO t : tasks) {
            csv.append(String.format("%d,\"%s\",\"%s\",%s,%s,%s,\"%s\",%s\n",
                    t.getId(),
                    escape(t.getTitle()),
                    escape(t.getDescription()),
                    t.getStatus(),
                    t.getPriority(),
                    t.getDueDate() != null ? t.getDueDate() : "",
                    escape(t.getAssigneeName()),
                    t.getCreatedAt()));
        }
        return csv.toString();
    }

    private static String escape(String s) {
        if (s == null) return "";
        String value = s.replace("\"", "\"\"");
        if (!value.isEmpty() && "+-=@\t\r".indexOf(value.charAt(0)) >= 0) {
            return "'" + value;
        }
        return value;
    }
}
