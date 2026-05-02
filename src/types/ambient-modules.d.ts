declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module '~virtual/svg-component' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown> & { name: string }
  export default component
}
