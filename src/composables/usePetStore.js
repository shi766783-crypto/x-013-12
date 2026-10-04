import { computed, reactive, watch } from 'vue'
import { achievementDefinitions, createDemoState, daysFromToday, isThisWeek, isValueInRange, todayISO, uid } from '../data'

const STORAGE_KEY = 'petcare-home-state'
const saved = localStorage.getItem(STORAGE_KEY)
const state = reactive(saved ? JSON.parse(saved) : createDemoState())

watch(state, (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)), { deep: true })

export function usePetStore() {
  const petById = (id) => state.pets.find((pet) => pet.id === id)
  const petName = (id) => petById(id)?.name || '未命名宠物'
  const totalActivity = computed(() => state.activities.filter((item) => isThisWeek(item.date)).reduce((sum, item) => sum + Number(item.duration || 0), 0))
  const pendingVaccines = computed(() => state.vaccines.filter((item) => daysFromToday(item.nextDate) <= 7).length)
  const feedingTasks = computed(() => state.feedings.reduce((sum, item) => sum + Number(item.times || 0), 0))
  const medicationsToday = computed(() => state.medications.filter((item) => item.startDate <= todayISO() && item.endDate >= todayISO()).length)
  const achievements = computed(() => achievementDefinitions.map((item) => ({ ...item, unlocked: item.condition(state) })))
  const healthCompleteness = (petId) => {
    const fields = ['weight', 'temperature', 'heartRate']
    const count = fields.filter((type) => state.healthRecords.some((item) => item.petId === petId && item.type === type)).length
    return Math.round((count / fields.length) * 100)
  }
  const metricCompliance = (petId, type) => {
    const pet = petById(petId)
    const records = state.healthRecords.filter((item) => item.petId === petId && item.type === type)
    if (!records.length) return null
    return Math.round((records.filter((item) => isValueInRange(item.value, pet, type)).length / records.length) * 100)
  }

  function updatePet(petId, payload) {
    const pet = petById(petId)
    if (pet) Object.assign(pet, payload)
  }

  function add(itemType, payload) {
    state[itemType].unshift({ id: uid(itemType.slice(0, -1)), ...payload })
  }
  function addPet(payload) {
    add('pets', payload)
  }
  function resetDemo() {
    const fresh = createDemoState()
    Object.keys(state).forEach((key) => { state[key].splice(0, state[key].length, ...(fresh[key] || [])) })
  }

  return { state, petById, petName, totalActivity, pendingVaccines, feedingTasks, medicationsToday, achievements, healthCompleteness, metricCompliance, add, addPet, updatePet, resetDemo }
}
