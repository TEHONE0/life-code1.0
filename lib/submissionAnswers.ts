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

// 归一化：null/undefined/"" 统一；去首尾空白、内部空白折叠、全角冒号逗号转半角。
// 重填时 basic_info 由滚轮重新拼装，标点/空格的细微差异不应判为"内容改了"导致简报被清空重生成。
const norm = (v: unknown) =>
  String(v ?? "")
    .replace(/[：]/g, ":")
    .replace(/[，]/g, ",")
    .replace(/\s+/g, " ")
    .trim();

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
