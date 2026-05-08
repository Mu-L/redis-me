<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { computed, inject, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { shareProvideKey } from '@/types/me-interface'
import type { RedisKey_Deserialize } from '@/types/tauri-specta'
import { DISPLAY_FORMAT, meCommands, meErr, meFormatBytes, meOk, meToBase64 } from '@/utils/util'

const { t } = useI18n()
const share = inject(shareProvideKey)!
defineExpose({ open })

const visible = ref(false)
const loading = ref(false)
const targetKey = ref<RedisKey_Deserialize | null>(null)
const encoding = ref('utf8')
const form = ref({ keyName: '' })
const formRef = useTemplateRef<FormInstance>('formRef')

const rules = computed<FormRules>(() => ({
  keyName: [
    {
      required: true,
      validator: (_rule, value, callback) => {
        if (!String(value ?? '').trim()) {
          callback(new Error(t('keyRename.keyNameRequired')))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}))

function open(data: { redisKey: RedisKey_Deserialize }) {
  targetKey.value = data.redisKey
  encoding.value = 'utf8'
  form.value.keyName = data.redisKey.key
  visible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

watch(encoding, () => {
  const k = targetKey.value
  if (!k || !visible.value) return
  form.value.keyName = encoding.value === 'utf8' ? k.key : meFormatBytes(k.bytes, encoding.value)
})

async function submit() {
  const k = targetKey.value
  const id = share.conn?.id
  if (!k || !id) return

  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  const value = form.value.keyName.trim()
  const enc = encoding.value
  if (enc !== 'utf8') {
    try {
      meToBase64(value, enc)
    } catch (e) {
      meErr(e instanceof Error ? e.message : String(e))
      return
    }
  }

  loading.value = true
  try {
    const newKey: RedisKey_Deserialize =
      enc === 'utf8' ? { key: value, bytes: '' } : { key: '', bytes: meToBase64(value, enc) }
    const apiNewKey = await meCommands.rename(id, k, newKey)
    k.key = apiNewKey.key
    k.bytes = apiNewKey.bytes
    meOk(t('actionOk'))
    visible.value = false
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    width="600px"
    destroy-on-close
    align-center
    :close-on-press-escape="false"
    :close-on-click-modal="false"
    draggable>

    <template #header>
      <me-icon icon="el-icon-edit-pen" :name="t('keyRename.title')" />
    </template>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="0">
      <el-row :gutter="10">
        <el-col :span="19">
          <el-form-item prop="keyName">
            <el-input v-model="form.keyName" clearable :placeholder="t('keyRename.newKeyName')" />
          </el-form-item>
        </el-col>
        <el-col :span="5">
          <el-form-item>
            <el-select v-model="encoding" style="width: 100%">
              <el-option
                v-for="item in DISPLAY_FORMAT"
                :key="item"
                :label="item"
                :value="item.toLowerCase()" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('cancel') }}</el-button>
      <el-button type="primary" :loading="loading" @click="submit" :disabled="!form.keyName">{{
        t('save')
      }}</el-button>
    </template>
  </el-dialog>
</template>
