<script setup>
import { cloneDeep } from 'lodash'
import { meInvoke } from '@/utils/util.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const emit = defineEmits(['success', 'closed'])

defineExpose({ open })
function open(_isCmdFile) {
  visible.value = true
  isCmdFile.value = _isCmdFile
  Object.assign(form.value, cloneDeep(initForm))
}

// 共享数据
const share = inject('share')

// 表单数据
const visible = ref(false)
const loading = ref(false)
const initForm = readonly({
  file: '',
  handleConflict: 'replace',
  handleTtl: 'parse',
  ttl: -1,
})

// 支持导入不同的文件类型
const isCmdFile = ref(false)
const fileSuffix = computed(() => isCmdFile.value ? 'txt' : 'csv')

const form = ref(cloneDeep(initForm))
const rules = computed(() => ({
  file: [{ required: true, message: t('keyImport.fileRequired') }],
}))
const handleConflictOptions = computed(() => [
  { label: t('keyImport.replace'), value: 'replace' },
  { label: t('keyImport.ignore'), value: 'ignore' },
])
const handleTtlOptions = computed(() => [
  { label: t('keyImport.parse'), value: 'parse' },
  { label: t('keyImport.forever'), value: 'forever' },
])

// 提交数据
const formRef = useTemplateRef('formRef')
function submit() {
  formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      if (isCmdFile.value) {
        await meInvoke('import_cmd', {id: share.conn.id, file: form.value.file})
      } else {
        await meInvoke('import_csv', {id: share.conn.id, param: form.value})
      }
      emit('success')
      visible.value = false
    } finally {
      loading.value = false
    }
  })
}
</script>

<template>
  <el-dialog
    :title="t('keyImport.title')"
    v-model="visible"
    :width="600"
    @closed="emit('closed')"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item :label="t('keyImport.file')" prop="file">
        <me-file-input
          v-model="form.file"
          :placeholder="t('keyImport.fileTip', {tip: fileSuffix})"
          :file-suffix="fileSuffix"
        />
      </el-form-item>

      <el-row :span="24" v-if="!isCmdFile">
        <el-col :span="12">
          <el-form-item :label="t('keyImport.handleConflict')">
            <el-segmented v-model="form.handleConflict" :options="handleConflictOptions" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="t('keyImport.handleTtl')">
            <el-segmented v-model="form.handleTtl" :options="handleTtlOptions" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">{{ t('cancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="submit" :disabled="!form.file">
        {{ t('keyImport.confirm') }}</el-button
      >
    </template>
  </el-dialog>
</template>
