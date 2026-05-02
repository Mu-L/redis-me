/** sortablejs 无官方 @types，仅声明本项目中用到的 API */
declare module 'sortablejs' {
  export interface SortableEvent {
    oldIndex?: number
    newIndex?: number
  }
  export interface SortableOptions {
    handle?: string
    onEnd?: (evt: SortableEvent) => void
  }
  export class Sortable {
    static create(el: HTMLElement, options?: SortableOptions): Sortable
  }
}
