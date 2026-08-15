import { Pool } from "pg";
import { TaskSummary } from "./types";

interface TotalsRow { total_tasks: string; completed_tasks: string; open_tasks: string; }
interface DailyRow { day: string; created: string; completed: string; }

export async function queryTaskSummary(pool: Pool): Promise<TaskSummary> {
  const totals = await pool.query<TotalsRow>(`
    SELECT COUNT(*) AS total_tasks,
           COUNT(*) FILTER (WHERE done) AS completed_tasks,
           COUNT(*) FILTER (WHERE NOT done) AS open_tasks
    FROM tasks
  `);
  const daily = await pool.query<DailyRow>(`
    SELECT TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
           COUNT(*) AS created,
           COUNT(*) FILTER (WHERE done) AS completed
    FROM tasks GROUP BY 1 ORDER BY 1 DESC LIMIT 14
  `);
  const row = totals.rows[0];
  const totalTasks = Number(row.total_tasks);
  const completedTasks = Number(row.completed_tasks);
  return { totalTasks, completedTasks, openTasks: Number(row.open_tasks), completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    daily: daily.rows.map((item) => ({ day: item.day, created: Number(item.created), completed: Number(item.completed) })) };
}
