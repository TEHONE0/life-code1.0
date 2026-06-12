/**
 * 八字推算模块
 * 从 Q01 自由文本中提取生辰信息，计算四柱八字 + 五行分布 + 大运
 */
// @ts-ignore
import { Lunar, Solar } from 'lunar-javascript'

// 时辰 → 时柱索引 (0-11)
const SHICHEN_MAP: Record<string, number> = {
  '子时': 0, '子': 0,
  '丑时': 1, '丑': 1,
  '寅时': 2, '寅': 2,
  '卯时': 3, '卯': 3,
  '辰时': 4, '辰': 4,
  '巳时': 5, '巳': 5,
  '午时': 6, '午': 6,
  '未时': 7, '未': 7,
  '申时': 8, '申': 8,
  '酉时': 9, '酉': 9,
  '戌时': 10, '戌': 10,
  '亥时': 11, '亥': 11,
}

// 24小时 → 时柱索引
function hourToShichen(h: number): number {
  if (h >= 23 || h < 1) return 0  // 子
  return Math.floor((h + 1) / 2)
}

// 农历月份汉字 → 数字
const LUNAR_MONTH_MAP: Record<string, number> = {
  '正': 1, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6,
  '七': 7, '八': 8, '九': 9, '十': 10, '十一': 11, '十二': 12, '腊': 12,
}

// 农历日 汉字 → 数字
function parseLunarDay(s: string): number {
  const map: Record<string, number> = {
    '初一': 1, '初二': 2, '初三': 3, '初四': 4, '初五': 5,
    '初六': 6, '初七': 7, '初八': 8, '初九': 9, '初十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
    '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
    '廿一': 21, '廿二': 22, '廿三': 23, '廿四': 24, '廿五': 25,
    '廿六': 26, '廿七': 27, '廿八': 28, '廿九': 29, '三十': 30,
  }
  return map[s.trim()] ?? parseInt(s) ?? 1
}

export interface BaziResult {
  pillars: { year: string; month: string; day: string; time: string }
  wuxing: { Metal: number; Wood: number; Water: number; Fire: number; Earth: number }
  dayun: Array<{ ganZhi: string; startYear: number; startAge: number }>
  startAge: number
  gender: string
  accuracy: string
  raw: string  // 格式化后注入 prompt 的文本
}

export function calcBazi(q01Text: string): BaziResult | null {
  try {
    const text = q01Text || ''

    // ── 性别 ──────────────────────────────────────────────
    let genderNum = 1  // 默认男
    let genderLabel = '男'
    if (/女|female|woman|girl/i.test(text)) {
      genderNum = 0
      genderLabel = '女'
    } else if (/男|male|man|boy/i.test(text)) {
      genderNum = 1
      genderLabel = '男'
    }

    // ── 时辰 ──────────────────────────────────────────────
    let timeIndex = -1
    for (const [key, val] of Object.entries(SHICHEN_MAP)) {
      if (text.includes(key)) { timeIndex = val; break }
    }
    // fallback: 数字时间 如 8:00 / 08:00 / 8点
    if (timeIndex === -1) {
      const mHour = text.match(/(\d{1,2})\s*[：:点时]/)
      if (mHour) timeIndex = hourToShichen(parseInt(mHour[1]))
    }
    const hasTime = timeIndex >= 0
    if (!hasTime) timeIndex = 6  // 默认午时

    // ── 判断阴历/阳历（滚轮选择器会带 阴历/Lunar/음력 前缀）─────
    const isLunar = /农历|阴历|陰曆|lunar|음력/i.test(text)

    // ── 统一数字日期提取：年月日 / 년월일 / - / / / . 各种分隔符 ──
    // 滚轮产出如「阴历，1991年2月5日」「Lunar, 1991-02-05」「1991.2.5」
    const digitDateRe = /(\d{4})\s*[年년.\-/]\s*(\d{1,2})\s*[月월.\-/]\s*(\d{1,2})/
    const mDigit = text.match(digitDateRe)
    if (isLunar && mDigit) {
      const lunar = Lunar.fromYmdHms(
        parseInt(mDigit[1]), parseInt(mDigit[2]), parseInt(mDigit[3]),
        timeIndex * 2, 0, 0
      )
      return buildResult(lunar, genderNum, genderLabel, hasTime)
    }

    // ── 尝试解析农历中文数字 ───────────────────────────────
    // 格式：农历YYYY年X月初X / 农历YYYY年十一月廿五
    const lunarRe = /农历\s*(\d{4})\s*年\s*([正一二三四五六七八九十腊]{1,3})月\s*([初一二三四五六七八九十廿三]+)/
    const mLunar = text.match(lunarRe)
    if (mLunar) {
      const ly = parseInt(mLunar[1])
      const monthChar = mLunar[2].replace('十一', '').replace('十二', '')
      let lm = 1
      if (mLunar[2] === '十一') lm = 11
      else if (mLunar[2] === '十二' || mLunar[2] === '腊') lm = 12
      else lm = LUNAR_MONTH_MAP[mLunar[2]] ?? 1
      const ld = parseLunarDay(mLunar[3])

      const lunar = Lunar.fromYmdHms(ly, lm, ld, timeIndex * 2, 0, 0)
      return buildResult(lunar, genderNum, genderLabel, hasTime)
    }

    // 以下为阳历分支：仅当未标注阴历时才走，避免阴历被阳历正则劫持
    // ── 尝试解析阳历中文 ─────────────────────────────────
    // 格式：1991年3月20日 / 1991年03月20日
    const solarRe = /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/
    const mSolar = text.match(solarRe)
    if (!isLunar && mSolar) {
      const solar = Solar.fromYmdHms(
        parseInt(mSolar[1]), parseInt(mSolar[2]), parseInt(mSolar[3]),
        timeIndex * 2, 0, 0
      )
      const lunar = solar.getLunar()
      return buildResult(lunar, genderNum, genderLabel, hasTime)
    }

    // ── 尝试解析英文日期 ─────────────────────────────────
    // 格式：Mar 20 1991 / March 20, 1991 / 1991-03-20
    const monthNames: Record<string, number> = {
      jan:1, feb:2, mar:3, apr:4, may:5, jun:6,
      jul:7, aug:8, sep:9, oct:10, nov:11, dec:12
    }
    const engRe = /([a-z]{3,})[.\s,]+(\d{1,2})[,\s]+(\d{4})/i
    const mEng = text.match(engRe)
    if (!isLunar && mEng) {
      const mo = monthNames[mEng[1].slice(0,3).toLowerCase()]
      if (mo) {
        const solar = Solar.fromYmdHms(
          parseInt(mEng[3]), mo, parseInt(mEng[2]),
          timeIndex * 2, 0, 0
        )
        const lunar = solar.getLunar()
        return buildResult(lunar, genderNum, genderLabel, hasTime)
      }
    }

    // ISO 格式 1991-03-20
    const isoRe = /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
    const mIso = text.match(isoRe)
    if (!isLunar && mIso) {
      const solar = Solar.fromYmdHms(
        parseInt(mIso[1]), parseInt(mIso[2]), parseInt(mIso[3]),
        timeIndex * 2, 0, 0
      )
      const lunar = solar.getLunar()
      return buildResult(lunar, genderNum, genderLabel, hasTime)
    }

    return null  // 无法解析
  } catch {
    return null
  }
}

function buildResult(lunar: any, genderNum: number, genderLabel: string, hasTime: boolean): BaziResult {
  const bazi = lunar.getEightChar()
  bazi.setSect(2)  // 晚子时属次日

  const pillars = {
    year: bazi.getYear(),
    month: bazi.getMonth(),
    day: bazi.getDay(),
    time: bazi.getTime(),
  }

  // 五行统计（天干地支各自的五行）
  const wuxing: Record<string, number> = { Metal: 0, Wood: 0, Water: 0, Fire: 0, Earth: 0 }
  const wxMap: Record<string, string> = {
    '金': 'Metal', '木': 'Wood', '水': 'Water', '火': 'Fire', '土': 'Earth'
  }
  const allWx = [
    bazi.getYearWuXing(), bazi.getMonthWuXing(),
    bazi.getDayWuXing(), bazi.getTimeWuXing()
  ]
  for (const wx of allWx) {
    for (const char of wx) {
      const key = wxMap[char]
      if (key) wuxing[key] = (wuxing[key] || 0) + 1
    }
  }

  // 大运
  const yun = bazi.getYun(genderNum)
  const startAge = yun.getStartYear()
    ? (new Date().getFullYear() - lunar.getYear()) + yun.getStartAge?.() || yun.getStartYear()
    : yun.getStartAge?.() || 0

  const dayunList = yun.getDaYun().slice(0, 6).map((dy: any) => ({
    ganZhi: dy.getGanZhi(),
    startYear: dy.getStartYear(),
    startAge: dy.getStartAge(),
  }))

  const currentYear = new Date().getFullYear()
  const currentDayun = dayunList.find((d: any, i: number) => {
    const next = dayunList[i + 1]
    return d.startYear <= currentYear && (!next || next.startYear > currentYear)
  })

  const raw = formatBaziForPrompt(pillars, wuxing, dayunList, currentDayun, genderLabel, hasTime, yun.getStartAge?.() || startAge)

  return { pillars, wuxing: wuxing as any, dayun: dayunList, startAge, gender: genderLabel, accuracy: hasTime ? '100%' : '~85%（缺出生时辰）', raw }
}

function formatBaziForPrompt(
  pillars: any, wuxing: any, dayun: any[], currentDayun: any,
  gender: string, hasTime: boolean, startAge: number
): string {
  const currentYear = new Date().getFullYear()
  const wxEntries = Object.entries(wuxing as Record<string, number>)
    .map(([k, v]) => `${k}:${v}`).join('  ')

  return `
【八字命盘（已自动推算，直接用于分析，禁止在报告中输出本段标题和括号说明）】
性别：${gender}
四柱：${pillars.year} | ${pillars.month} | ${pillars.day} | ${hasTime ? pillars.time : pillars.time + '（时辰未知，仅供参考）'}
五行分布：${wxEntries}
起运年龄：约${startAge}岁
大运列表（每10年一运）：
${dayun.map(d => `  ${d.ganZhi}  ${d.startYear}年  ${d.startAge}岁`).join('\n')}
当前大运（${currentYear}年）：${currentDayun ? `${currentDayun.ganZhi}（${currentDayun.startYear}年起）` : '见上表'}
${!hasTime ? '⚠️ 用户未提供时辰，时柱仅供参考，分析时注明精度约85%' : ''}
`.trim()
}
