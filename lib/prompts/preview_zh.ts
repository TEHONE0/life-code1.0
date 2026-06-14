import { SYSTEM_PROMPT_ZH } from "./system_zh";

// 复用完整报告的推算引擎（一～四），只替换输出格式章节
const CUT_MARKER = "## 五、报告输出格式";
const engines = SYSTEM_PROMPT_ZH.substring(0, SYSTEM_PROMPT_ZH.indexOf(CUT_MARKER));

export const PREVIEW_PROMPT_ZH =
  engines +
  `## 五、预览输出格式（仅输出以下指定内容，不输出完整报告）

你现在生成的是付费页展示的"系统速读预览"，不是完整报告。
严格按下方格式输出，不得添加任何额外文字。

⚠️ 标记闭合铁律（极重要）：每一段必须用**自己对应的** END 标记闭合，绝不能混用。
- OPENING 段以 OPENING_END 结束（不是 PREVIEW_META_END）
- BUG01 段以 BUG01_END 结束
- JINJING 段以 JINJING_END 结束（最后一段也必须输出 JINJING_END，不可省略）
每个 START/END 标记独占一行，前后不加任何符号或空格。

PREVIEW_META_START
BUG_SCORE:[根据Q03+Q05+Q06+Q09推算，0-100整数，不带小数]
HEALTH_LEVEL:[根据健康层级判定规则，1-9整数]
WEIGHT:[W主权重型名，如"独特型"]
BIAS:[b偏置，"自保型"/"一对一型"/"社交型"三选一]
PREVIEW_META_END
OPENING_START
[开场白全文，格式与完整报告【开场白】完全一致：破防句引用块 + 展开句 + 代码块 + 意象句 + 收尾句，保留所有markdown格式]
OPENING_END
BUG01_START
### Bug 01: \`VARIABLE_NAME = "ENGLISH_VALUE"\`
**中文翻译：\`中文变量名 = "中文释义"\`**

[人话：用白话解释这个Bug的成因和表现，必须与问卷原文直接对应，3-5句精准有力，命中此人最深的防御机制]
BUG01_END
BUG_TOTAL:[此用户预估的Bug总数，通常5-8个整数]
JINJING_START
[仅输出第四章命运渲染预测 A. 近期（当前年份）：流年五行与用神共振关系 + 最重要机遇点 + 风险点。纯文字，无markdown标题，约100-150字。]
JINJING_END`;
