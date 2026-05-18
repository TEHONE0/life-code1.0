import { en } from '../messages/en'
import { zh } from '../messages/zh'
import { ko } from '../messages/ko'

export type Lang = 'en' | 'zh' | 'ko'

export const translations = { en, zh, ko }

export function getT(lang: Lang) {
  return translations[lang] ?? translations.en
}
