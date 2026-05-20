/** sortablejs 无官方 @types，仅声明本项目中用到的 API */
declare module 'sortablejs' {
  export interface SortableEvent {
    oldIndex?: number
    newIndex?: number
    from: HTMLElement
    to: HTMLElement
    item: HTMLElement
  }
  export interface SortableOptions {
    draggable?: string
    handle?: string
    filter?: string
    preventOnFilter?: boolean
    animation?: number
    group?: string | { name: string; pull?: boolean | string; put?: boolean | string }
    onEnd?: (evt: SortableEvent) => void
  }
  export class Sortable {
    static create(el: HTMLElement, options?: SortableOptions): Sortable
    destroy(): void
  }
}
