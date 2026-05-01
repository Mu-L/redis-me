import type { App } from 'vue'
import SvgIcon from '~virtual/svg-component'

export default function setupSvgIcon(app: App): void {
  app.component(SvgIcon.name, SvgIcon)
}
