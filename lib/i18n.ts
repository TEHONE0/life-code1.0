import { en } from '../messages/en'
import { zh } from '../messages/zh'
import { ko } from '../messages/ko'
import { ja } from '../messages/ja'
import { th } from '../messages/th'
import { id } from '../messages/id'

export type Lang = 'en' | 'zh' | 'ko' | 'ja' | 'th' | 'id'

export const translations = { en, zh, ko, ja, th, id }

export function getT(lang: Lang) {
  return translations[lang] ?? translations.en
}
