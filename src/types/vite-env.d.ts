/// <reference types="vite/client" />

declare global {
  /** tauri 插件挂载的响应式全局（结构随业务扩展） */
  interface MeTauriGlobal {
    connList: import('./tauri-specta').ConnConfig[]
    settings: Record<string, unknown> & {
      language?: string
      theme?: string
      keyScanCount?: number
      fieldScanCount?: number
      keyShow?: string
      keySort?: string
      keyHeight?: number
      keyLabel?: string
      connShow?: 'flat' | 'group'
      connGroups?: string[]
      uiFont?: string[]
      codeFont?: string[]
      autoUpdate?: boolean
    }
    systemTheme: string
    systemLanguage: string
    isAppStore: boolean
  }

  const meTauri: MeTauriGlobal

  interface Window {
    meTauri: MeTauriGlobal
    /** element-plus 插件写入，供运行时切换语言包 */
    ElementPlusLanguageMap?: Record<string, unknown>
    /**
     * Local Font Access（实验性；部分 TS 自带的 DOM lib 未收录）
     * https://wicg.github.io/local-font-access/
     */
    queryLocalFonts?: () => Promise<
      ReadonlyArray<{ readonly style: string; readonly fullName: string }>
    >
  }
}

export {}
