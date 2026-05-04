import { computed } from 'vue'

import { isZh } from '@/utils/util'

import { enInfoTip } from './en'
import { zhInfoTip } from './zh-cn'

export const infoTip = computed(() => (isZh.value ? zhInfoTip : enInfoTip))
