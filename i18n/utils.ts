import { i18n, pathCache, setLocaleMessage, deleteLocaleMessage, hasLocaleMessage, mergeToGlobalRoot, type SupportedLocale } from "."

// Pre-load all i18n modules using a more general glob pattern
const i18nModules = import.meta.glob('/src/**/i18n/*.ts', { eager: true })

// Debug: log all available modules
// console.log('[i18n] Available modules:', Object.keys(i18nModules))

export const loadI18n = async (namespace: string | undefined, path: string) => {
  const locale = i18n.global.locale.value as SupportedLocale
  if (pathCache.has(path)) {
    console.warn(`[i18n] ${path} already loaded`)
    return
  }

  // 如果有 namespace，检查是否已经存在该 namespace 的消息
  if (namespace && hasLocaleMessage(namespace)) {
    console.warn(`[i18n] namespace '${namespace}' already exists`)
    return
  }

  pathCache.add(path)

  try {
    const moduleKey = `${path}/${locale}.ts`

    // console.log(`[i18n] Looking for module: ${moduleKey}`)

    if (i18nModules[moduleKey]) {
      const module = i18nModules[moduleKey] as any
      const messages = module.default || module
      
      if (namespace) {
        // 有 namespace 时，使用原有逻辑
        setLocaleMessage(namespace, messages)
        console.log(`[i18n] Successfully loaded with namespace '${namespace}': ${moduleKey}`)
      } else {
        // 没有 namespace 时，直接合并到根目录
        mergeToGlobalRoot(messages)
        console.log(`[i18n] Successfully loaded to global root: ${moduleKey}`)
      }
      
      // 查看当前的 i18n 消息
      console.log('[i18n] Current messages:', i18n.global.messages)
    } else {
      // console.log('[i18n] Available keys:', Object.keys(i18nModules))
      throw new Error(`Module not found: ${moduleKey}`)
    }
  } catch (error) {
    console.error(`[i18n] ${namespace || 'global root'} load failed`, error)
    pathCache.delete(path) // 失败时清除缓存
  }
}
