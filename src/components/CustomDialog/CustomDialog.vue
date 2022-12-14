<template>
  <div
    class="custom-dialog"
  >
    <div
      ref="backgroundMaskRef"
      class="background-mask"
      @mousedown.self="handleMousedown"
      @mouseup.self="handleMouseup"
      @click="handleBackgroundMaskClick"
      @keypress.escape.self="handleBackgroundMaskClick"
    >
      <div
        ref="dialogWrapperRef"
        class="dialog-wrapper"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  defineProps, defineExpose, defineEmits, ref, watch, computed,
} from 'vue'
import gsap, { Expo } from 'gsap'
import { until } from '@open-draft/until'

import { Nullable } from '@/types/utils'
import { CustomDialogProps } from './types'

type CustomDialogEmits = {
  (e: 'update:value', payload: CustomDialogProps): void
}

const props = defineProps<{
  value: CustomDialogProps
}>()

const emit = defineEmits<CustomDialogEmits>()

const dialogWrapperRef = ref<HTMLElement>()
const backgroundMaskRef = ref<HTMLElement>()
const showDialog = computed(() => props.value.show)
const fadeAnimationDuration = 0.5
let canCloseDialog = true
const isSameMousedownTarget = ref(false)
const isSameMouseupTarget = ref(false)

const fadeIn = (): Promise<void> => new Promise((resolve) => {
  const dialogWrapperEl = dialogWrapperRef.value

  if (backgroundMaskRef.value == null) {
    throw new Error('Element not exist')
  }

  if (dialogWrapperEl == null) {
    throw new Error('Element not exist')
  }

  const timeline = gsap.timeline()

  timeline.fromTo(backgroundMaskRef.value, {
    autoAlpha: 0,
  }, {
    autoAlpha: 1,
    duration: fadeAnimationDuration,
    ease: Expo.easeOut,
    onStart: () => {
      if (props.value.onFadeInStart == null) return

      props.value.onFadeInStart()
    },
    onComplete() {
      resolve()
    },
  }, 0)

  timeline.fromTo(dialogWrapperEl, {
    autoAlpha: 0,
    scale: 0.5,
  }, {
    autoAlpha: 1,
    scale: 1,
    duration: fadeAnimationDuration,
    ease: Expo.easeOut,
    onComplete() {
      resolve()
    },
  }, 0)
})

const fadeOut = (): Promise<void> => new Promise((resolve, reject) => {
  const dialogWrapperEl: Nullable<HTMLElement> = dialogWrapperRef.value

  if (backgroundMaskRef.value == null) {
    reject(new Error('Element not exist'))
    return
  }

  if (dialogWrapperEl == null) {
    reject(new Error('Element not exist'))
    return
  }

  const timeline = gsap.timeline()

  timeline.fromTo(backgroundMaskRef.value, {
    autoAlpha: 1,
  }, {
    autoAlpha: 0,
    duration: fadeAnimationDuration,
    ease: Expo.easeOut,
    onComplete() {
      resolve()
    },
  }, 0)

  timeline.fromTo(dialogWrapperEl, {
    autoAlpha: 1,
    scale: 1,
  }, {
    autoAlpha: 0,
    scale: 0.5,
    duration: fadeAnimationDuration,
    ease: Expo.easeOut,
    onComplete() {
      resolve()
    },
  }, 0)
})

const show = async () => {
  const result = await until(() => fadeIn())
  if (result.error) throw result.error
}

const close = async () => {
  if (!canCloseDialog) return

  canCloseDialog = false
  const result = await until(() => fadeOut())
  canCloseDialog = true

  if (result.error != null) throw result.error
}

const handleBackgroundMaskClick = async () => {
  if (!isSameMousedownTarget.value || !isSameMouseupTarget.value) return

  isSameMousedownTarget.value = false
  isSameMouseupTarget.value = false

  emit('update:value', { show: false })
}

const handleMousedown = (e: MouseEvent) => {
  isSameMousedownTarget.value = e.target === e.currentTarget
}

const handleMouseup = (e: MouseEvent) => {
  isSameMouseupTarget.value = e.target === e.currentTarget
}

watch(showDialog, async () => {
  if (showDialog.value) {
    const result = await until(() => show())
    if (result.error) console.error(result.error)
    return
  }

  const result = await until(() => close())
  if (result.error) console.error(result.error)
})

defineExpose({
  show,
  close,
  handleBackgroundMaskClick,
})

</script>

<style lang="scss" scoped>
@use "@/style/constants.scss" as constants;
@use "@/style/colors.scss" as colors;

.custom-dialog {
  position: fixed;
  z-index: 999;

  .background-mask {
    display: grid;
    position: fixed;
    top: 0;
    left: 0;
    place-items: center;
    visibility: hidden;
    z-index: 1000;
    background-color: rgb(0 0 0 / 50%);
    width: 100vw;
    height: 100vh;

    .dialog-wrapper {
      visibility: hidden;

      // border-radius: constants.$border-radius;
      // background-color: white;
      width: fit-content;
      height: fit-content;
    }
  }
}
</style>
