import { i18n, pathCache, setLocaleMessage, hasLocaleMessage, mergeToGlobalRoot, type SupportedLocale } from "."

const i18nModules = import.meta.glob('/src/**/i18n/*.ts')

export const loadI18n = async (namespace: string | undefined, path: string) => {
  const locale = i18n.global.locale.value as SupportedLocale
  if (pathCache.has(path)) {
    return
  }

  // 如果有 namespace，检查是否已经存在该 namespace 的消息
  if (namespace && hasLocaleMessage(namespace)) {
    return
  }

  pathCache.add(path)

  try {
    const moduleKey = `${path}/${locale}.ts`

    if (i18nModules[moduleKey]) {
      const module = await i18nModules[moduleKey]() as any
      const messages = module.default || module
      
      if (namespace) {
        // 有 namespace 时，使用原有逻辑
        setLocaleMessage(namespace, messages)
      } else {
        // 没有 namespace 时，直接合并到根目录
        mergeToGlobalRoot(messages)
      }
      
    } else {
      throw new Error(`Module not found: ${moduleKey}`)
    }
  } catch (error) {
    console.error(`[i18n] ${namespace || 'global root'} load failed`, error)
    pathCache.delete(path) // 失败时清除缓存
  }
}
