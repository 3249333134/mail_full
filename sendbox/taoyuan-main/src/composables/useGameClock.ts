import { ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { PASSOUT_HOUR, MIDNIGHT_HOUR } from '@/data/timeConstants'
import { addLog } from './useGameLog'
import { handleEndDay } from './useEndDay'

// === 常量 ===
/** 星露谷速率：0.7 真实秒 = 1 游戏分钟 */
const REAL_MS_PER_GAME_MINUTE = 700
/** tick 间隔（ms），越小显示越平滑 */
const TICK_MS = 200

// === 模块级单例状态 ===
const gameSpeed = ref(1)
const isPaused = ref(true)
let timerId: ReturnType<typeof setInterval> | null = null
/** 页面隐藏前时钟是否在运行（用于恢复） */
let wasRunningBeforeHidden = false

/** 每个 tick 推进的游戏小时数 */
const getHoursPerTick = (): number => {
  const minutesPerTick = (TICK_MS / REAL_MS_PER_GAME_MINUTE) * gameSpeed.value
  return minutesPerTick / 60
}

/** 时钟 tick */
const tick = () => {
  if (isPaused.value) return

  const gameStore = useGameStore()
  const prevHour = gameStore.hour
  const hoursPerTick = getHoursPerTick()
  const newHour = prevHour + hoursPerTick

  // 到达昏倒时间 → 自动结算
  if (newHour >= PASSOUT_HOUR) {
    gameStore.hour = PASSOUT_HOUR
    isPaused.value = true
    addLog('已经凌晨2点了，你撑不住倒下了……')
    handleEndDay()
    // 新一天开始后恢复时钟（如果 handleEndDay 触发了弹窗，GameLayout 的 watcher 会自动暂停）
    isPaused.value = false
    return
  }

  gameStore.hour = newHour

  // 跨午夜提示（仅一次，与 advanceTime 共享标志）
  if (!gameStore.midnightWarned && prevHour < MIDNIGHT_HOUR && newHour >= MIDNIGHT_HOUR) {
    gameStore.midnightWarned = true
    addLog('已经过了午夜，你开始感到困倦……')
  }
}

export const useGameClock = () => {
  /** 启动实时时钟 */
  const startClock = () => {
    if (timerId) return
    isPaused.value = false
    timerId = setInterval(tick, TICK_MS)
  }

  /** 停止实时时钟（销毁 interval） */
  const stopClock = () => {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
    isPaused.value = true
  }

  /** 暂停时钟（interval 保留但 tick 跳过） */
  const pauseClock = () => {
    isPaused.value = true
  }

  /** 恢复时钟 */
  const resumeClock = () => {
    isPaused.value = false
  }

  /** 设置速度倍率 */
  const setSpeed = (speed: number) => {
    gameSpeed.value = speed
  }

  /** 循环切换速度 1→2→3→1 */
  const cycleSpeed = () => {
    gameSpeed.value = gameSpeed.value >= 3 ? 1 : gameSpeed.value + 1
  }

  /** 切换暂停/恢复 */
  const togglePause = () => {
    isPaused.value = !isPaused.value
  }

  return {
    gameSpeed,
    isPaused,
    startClock,
    stopClock,
    pauseClock,
    resumeClock,
    setSpeed,
    cycleSpeed,
    togglePause
  }
}

// === 页面可见性处理（切标签页时暂停时钟，防止后台累积时间跳跃） ===
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    wasRunningBeforeHidden = !isPaused.value
    if (!isPaused.value) isPaused.value = true
  } else {
    if (wasRunningBeforeHidden) isPaused.value = false
    wasRunningBeforeHidden = false
  }
})
