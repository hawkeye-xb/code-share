import { createI18n } from 'vue-i18n'

export const SUPPORTED_LOCALES = ['en', 'zh', 'ja'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

export const DEFAULT_LOCALE: SupportedLocale = 'en'

export const pathCache = new Set<string>()

export const i18n = createI18n({
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {},
  legacy: false,
  globalInjection: true,
})

export const setLocaleMessage = (namespace: string, messages: Record<string, any>) => {
  if (!namespace || !messages) {
    console.warn('[i18n] setLocaleMessage: namespace and messages are required')
    return
  }

  try {
    const locale = i18n.global.locale.value as SupportedLocale

    // 使用 vue-i18n 内置的 mergeLocaleMessage 方法
    const namespacedMessages = { [namespace]: messages }
    i18n.global.mergeLocaleMessage(locale, namespacedMessages)

    // console.log('[i18n] setLocaleMessage success:', { namespace, locale, messageCount: Object.keys(messages).length })
  } catch (error) {
    console.error('[i18n] setLocaleMessage error:', error)
  }
}

// 将消息直接合并到根目录，保持结构
export const mergeToGlobalRoot = (messages: Record<string, any>) => {
  if (!messages) {
    console.warn('[i18n] mergeToGlobalRoot: messages are required')
    return
  }

  try {
    const locale = i18n.global.locale.value as SupportedLocale
    
    // 直接将消息合并到根级别，保持原有的结构（如 leftSider）
    i18n.global.mergeLocaleMessage(locale, messages)

    // console.log('[i18n] mergeToGlobalRoot success:', { locale, messageCount: Object.keys(messages).length })
  } catch (error) {
    console.error('[i18n] mergeToGlobalRoot error:', error)
  }
}

export const deleteLocaleMessage = (namespace: string) => {
  if (!namespace) {
    console.warn('[i18n] deleteLocaleMessage: namespace is required')
    return
  }

  try {
    const locale = i18n.global.locale.value as SupportedLocale

    // 使用 vue-i18n 安全的方式获取和设置消息
    const currentMessages = i18n.global.getLocaleMessage(locale) as Record<string, any> || {}

    // 检查 namespace 是否存在
    if (!(namespace in currentMessages)) {
      console.warn(`[i18n] deleteLocaleMessage: namespace '${namespace}' not found`)
      return
    }

    const updatedMessages: Record<string, any> = { ...currentMessages }
    delete updatedMessages[namespace]
    i18n.global.setLocaleMessage(locale, updatedMessages)

    // console.log('[i18n] deleteLocaleMessage success:', { namespace, locale })
  } catch (error) {
    console.error('[i18n] deleteLocaleMessage error:', error)
  }
}

// 检查指定 namespace 是否存在
export const hasLocaleMessage = (namespace: string): boolean => {
  try {
    const locale = i18n.global.locale.value as SupportedLocale
    const currentMessages = i18n.global.getLocaleMessage(locale) as Record<string, any> || {}
    return namespace in currentMessages
  } catch (error) {
    console.error('[i18n] hasLocaleMessage error:', error)
    return false
  }
}

// 获取指定 namespace 的消息
export const getNamespaceMessage = (namespace: string): Record<string, any> | null => {
  try {
    const locale = i18n.global.locale.value as SupportedLocale
    const currentMessages = i18n.global.getLocaleMessage(locale) as Record<string, any> || {}
    return currentMessages[namespace] || null
  } catch (error) {
    console.error('[i18n] getNamespaceMessage error:', error)
    return null
  }
}

// store -> browser -> default
export function getStoredLocale(): SupportedLocale {
  const stored = localStorage.getItem('locale') as SupportedLocale
  const browserLocale = navigator.language.toLowerCase()
  
  // Check for exact match first
  if (SUPPORTED_LOCALES.includes(browserLocale as SupportedLocale)) {
    return browserLocale as SupportedLocale
  }
  
  // Extract language prefix from various locale formats (zh-CN, zh_CN, zh@CN, etc.)
  const languagePrefix = browserLocale.split(/[-_@]/)[0]
  
  // Find matching supported locale by language prefix
  const matchedLocale = SUPPORTED_LOCALES.find(locale => locale === languagePrefix)
  
  if (matchedLocale) {
    return matchedLocale
  }
  
  return SUPPORTED_LOCALES.includes(stored) ? stored : DEFAULT_LOCALE
}

// Pre-load all global i18n modules
const globalModules = import.meta.glob('./global/*.ts', { eager: true })

// Debug: log all available global modules
// console.log('[i18n] Available global modules:', Object.keys(globalModules))

const loadGlobalMessages = async (locale: SupportedLocale) => {
  // Attention: associated with the file structure
  const moduleKey = `./global/${locale}.ts`
  pathCache.add(moduleKey)

  // console.log(`[i18n] Loading global module: ${moduleKey}`)

  if (globalModules[moduleKey]) {
    const module = globalModules[moduleKey] as any
    // console.log(`[i18n] Successfully loaded global module: ${moduleKey}`)
    return module.default || module
  } else {
    console.error(`[i18n] Global i18n module not found: ${moduleKey}`)
    // console.log('[i18n] Available global keys:', Object.keys(globalModules))
    throw new Error(`Global i18n module not found: ${moduleKey}`)
  }
}

export async function initI18n() {
  const initialLocale = getStoredLocale()
  console.log('[i18n] initialLocale:', initialLocale)
  i18n.global.locale.value = initialLocale
  const globalMessages = await loadGlobalMessages(initialLocale)
  // 直接将全局消息合并到根目录，不创建 global 命名空间
  mergeToGlobalRoot(globalMessages)
  return i18n
} 