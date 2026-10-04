<script setup>
import { computed, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { getMetricRange, metricTypes, normalRanges } from '../data'

const props = defineProps({ visible: Boolean, pet: { type: Object, default: null } })
const emit = defineEmits(['close', 'submit'])
const form = ref({})
const error = ref('')

const metrics = computed(() => metricTypes.map((type) => ({
  type,
  ...normalRanges[type],
  defaultRange: getMetricRange(null, type),
})))

function reset() {
  form.value = Object.fromEntries(metricTypes.map((type) => {
    const range = props.pet?.referenceRanges?.[type]
    return [type, { min: range?.min ?? '', max: range?.max ?? '' }]
  }))
  error.value = ''
}

function restoreDefaults() {
  form.value = Object.fromEntries(metricTypes.map((type) => [type, { min: '', max: '' }]))
  error.value = ''
}

function submit() {
  const referenceRanges = {}
  for (const type of metricTypes) {
    const minValue = form.value[type].min
    const maxValue = form.value[type].max
    const minEmpty = minValue === '' || minValue === null
    const maxEmpty = maxValue === '' || maxValue === null
    if (minEmpty && maxEmpty) continue
    if (minEmpty || maxEmpty) {
      error.value = `请完整填写${normalRanges[type].label}的最小值和最大值，或两栏都留空使用默认值。`
      return
    }
    const min = Number(minValue)
    const max = Number(maxValue)
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || min >= max) {
      error.value = `${normalRanges[type].label}区间需要满足最小值不小于 0，且小于最大值。`
      return
    }
    referenceRanges[type] = { min, max }
  }
  emit('submit', { referenceRanges })
}

watch(() => props.visible, (visible) => { if (visible) reset() })
watch(() => props.pet?.id, reset)
</script>

<template>
  <div v-if="visible" class="modal-backdrop" @click.self="emit('close')">
    <section class="modal compact-modal range-modal">
      <header class="modal-header">
        <div><span class="eyebrow">专属参考区间</span><h2>{{ pet?.name || '宠物' }} 的健康标准</h2></div>
        <button class="icon-btn" @click="emit('close')"><X :size="18" /></button>
      </header>
      <p class="range-intro">两栏都留空时继续使用通用默认值；修改后历史数值不变，状态、参考带和达标率会按新区间重新计算。</p>
      <form class="range-form" @submit.prevent="submit">
        <div v-for="metric in metrics" :key="metric.type" class="range-row">
          <div><strong>{{ metric.label }}</strong><span>默认 {{ metric.defaultRange.min }} - {{ metric.defaultRange.max }} {{ metric.unit }}</span></div>
          <input v-model="form[metric.type].min" type="number" min="0" step="0.1" placeholder="最小" />
          <em>-</em>
          <input v-model="form[metric.type].max" type="number" min="0" step="0.1" :placeholder="`最大（${metric.unit}）`" />
        </div>
        <p v-if="error" class="range-error">{{ error }}</p>
        <footer class="modal-actions range-actions">
          <button type="button" class="btn btn-quiet" @click="restoreDefaults">清空并使用默认值</button>
          <button type="button" class="btn btn-quiet" @click="emit('close')">取消</button>
          <button class="btn btn-primary" type="submit">保存区间</button>
        </footer>
      </form>
    </section>
  </div>
</template>
