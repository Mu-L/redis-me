import { computed } from 'vue'

import { isZh } from '@/utils/util'

import { enClientTip } from './en'
import { zhClientTip } from './zh-cn'

export const clientTip = computed(() => (isZh.value ? zhClientTip : enClientTip))
