// 判断已存的 submission 问卷字段与新提交的答案是否有差异
// 用于决定是否让已生成的简报(preview)失效：一字未改则保留缓存省算力，改了才重新解析

interface AnswerRow {
  enneagram?: string | null;
  basic_info?: string | null;
  origin?: string | null;
  critical_error?: string | null;
  core_loop?: string | null;
  const_value?: string | null;
  status?: string | null;
  legacy?: string | null;
  dimension?: string | null;
  defense?: string | null;
}

interface Answers {
  enneagram?: string;
  basic_info?: string;
  origin?: string;
  critical_error?: string;
  core_loop?: string;
  const?: string;
  status?: string;
  legacy?: string;
  dimension?: string;
  defense?: string;
}

const norm = (v: unknown) => (v ?? ""); // null/undefined/"" 归一，避免误判变化

export function answersDiffer(row: AnswerRow, a: Answers): boolean {
  return (
    norm(row.enneagram) !== norm(a.enneagram) ||
    norm(row.basic_info) !== norm(a.basic_info) ||
    norm(row.origin) !== norm(a.origin) ||
    norm(row.critical_error) !== norm(a.critical_error) ||
    norm(row.core_loop) !== norm(a.core_loop) ||
    norm(row.const_value) !== norm(a.const) ||
    norm(row.status) !== norm(a.status) ||
    norm(row.legacy) !== norm(a.legacy) ||
    norm(row.dimension) !== norm(a.dimension) ||
    norm(row.defense) !== norm(a.defense)
  );
}
