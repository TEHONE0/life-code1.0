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
- TAGLINE 段以 TAGLINE_END 结束
- OPENING 段以 OPENING_END 结束（不是 PREVIEW_META_END）
- BUG01 段以 BUG01_END 结束
- JINJING 段以 JINJING_END 结束
- HOOK 段以 HOOK_END 结束（最后一段也必须输出 HOOK_END，不可省略）
每个 START/END 标记独占一行，前后不加任何符号或空格。

PREVIEW_META_START
BUG_SCORE:[根据Q03+Q05+Q06+Q09推算，0-100整数，不带小数]
HEALTH_LEVEL:[根据健康层级判定规则，1-9整数]
WEIGHT:[W主权重型名，如"独特型"]
BIAS:[b偏置，"自保型"/"一对一型"/"社交型"三选一]
PREVIEW_META_END
TAGLINE_START
[一句定调句，固定格式：你不是普通的[X]，而是用"[XXX]"渲染密度的算法。X=此人身份/职业/角色；XXX=此人独有的生命质地，用走心的心理学语言（如"孤独与自由""失去与重建"，来自问卷原文），禁止通用词，禁止中文五行字。只输出这一句，不带 markdown 引用符号]
TAGLINE_END
OPENING_START
[开场白正文（不含上面的定调句）：破防句 + 展开句 + 代码块 + 意象句 + 收尾句，保留markdown格式]
OPENING_END
BUG01_START
### Bug 01: \`VARIABLE_NAME = "ENGLISH_VALUE"\`
**中文翻译：\`中文变量名 = "中文释义"\`**

[人话：用白话解释这个Bug的成因和表现，必须与问卷原文直接对应，3-5句精准有力，命中此人最深的防御机制]
BUG01_END
BUG_TOTAL:[此用户预估的Bug总数，通常5-8个整数]
JINJING_START
[近景·当前阶段，纯文字无标题，约120-160字，严格按以下四层结构：
① 当前年份定调：当前年份是你从"[旧模式]"切换到"[新模式]"的关键节点（模式名用系统语言，如"生存修复模式"→"创造输出模式"）
② 能量分析：用英文元素词（Fire/Water/Wood/Metal/Earth，禁止中文金木水火土）说出此人能量分布的短板，并把短板转化为一种独特优势视角。范例句式："Fire能量稀缺、Water能量为零，意味着情绪表达和深度感知是你的短板——但这也让你避开了情感内耗，能以更冷静的架构师视角打磨作品"
③ 机遇在于：[只点出方向，用一句吊胃口的话，绝不展开具体是什么、怎么做——制造好奇]
④ 风险在于：[只点出警示存在，用一句吊胃口的话，绝不说破具体内容——制造好奇]]
JINJING_END
HOOK_START
[一句基于此人真实问卷数据的强力钩子，点明"你的未来藏着一个更大的可能"——具体指向此人独有的某个潜能或转折点，让用户强烈想看完整报告。一句话，走心，不空泛，不剧透答案]
HOOK_END`;
