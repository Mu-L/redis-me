import { computed } from 'vue'

import { isZh } from '@/utils/util'

import { enConfigTip } from './en'
import { zhConfigTip } from './zh-cn'

export const configTip = computed(() => (isZh.value ? zhConfigTip : enConfigTip))
