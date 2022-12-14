<template>
  <CustomDialog
    ref="customDialogRef"
    :value="customDialogProps"
    @update:value="handleUpdateShow"
    @keydown.enter="handleEnter"
  >
    <div
      :key="`calendar-item-dialog${props.value.show}`"
      class="calendar-item-dialog"
    >
      <header class="calendar-item-dialog-header">
        <span
          class="title"
          v-text="dialogTitle"
        />
        <CloseButton
          class="close-button"
          @click="handleCloseButtonClick"
          @keydown="handleCloseButtonClick"
        />
      </header>
      <CustomInput
        ref="weightInputRef"
        :input-text="weight"
        class="weight-input"
        :validate-config="weightValidateConfig"
        placeholder="Weight"
        @update:input-text="handleUpdateInputText"
        @focus="handleInputFocus"
        @blur="handleInputBlur"
      />
    </div>
  </CustomDialog>
</template>

<script lang="ts" setup>
import {
  defineProps, defineEmits, computed, ref, nextTick,
} from 'vue'
import { DateTime } from 'luxon'

import CustomDialog from '@/components/CustomDialog/CustomDialog.vue'
import { CustomDialogProps } from '@/components/CustomDialog/types'
import CustomInput from '@/components/CustomInput/CustomInput.vue'
import { updateDailyRecord } from '@/firebase/firestore'
import { until } from '@open-draft/until'
import { useToast } from 'vue-toastification'
import { ValidateConfig } from '@/components/CustomInput/types'
import CloseButton from '@/components/CloseButton.vue'
import { CalendarItemDialogProps } from './types'

type CalendarItemDialogEmits = {
  (e: 'update:value', payload: CalendarItemDialogProps): void
  (e: 'record-updated', payload: {isTargetMonth: boolean}): void
}
const props = defineProps<{
  value: CalendarItemDialogProps
}>()

const weightBefore = ref('')
const weightInputRef = ref<InstanceType<typeof CustomInput>>()
const customDialogRef = ref<InstanceType<typeof CustomDialog>>()
const weight = computed(() => props.value.calendarItem.weight)
const dialogTitle = computed(() => props.value.calendarItem.dateTime.setLocale('en-GB').toLocaleString(DateTime.DATE_FULL))

const focusFirstInput = () => {
  nextTick(() => {
    weightInputRef.value?.focusAtEnd()
  })
}

const customDialogProps = computed(() => ({
  show: props.value.show,
  onFadeInStart: () => {
    focusFirstInput()
  },
}) as CustomDialogProps)

const weightValidateConfig: ValidateConfig = {
  event: 'input',
  validateFunction: (weight: string) => {
    const isEmpty = weight.length === 0
    if (isEmpty) {
      return {
        isValid: true,
        errorMessage: '',
      }
    }

    const isInvalidFormat = !/^\d+(.\d+)*$/.test(weight)
    if (isInvalidFormat) {
      return {
        isValid: false,
        errorMessage: 'Please input numbers only',
      }
    }

    return {
      isValid: true,
      errorMessage: '',
    }
  },
}

const emit = defineEmits<CalendarItemDialogEmits>()

const updateProps = (newPropsValue: Partial<CalendarItemDialogProps>) => {
  emit('update:value', {
    ...props.value,
    ...newPropsValue,
  })
}

const handleUpdateShow = (payload: CustomDialogProps) => {
  updateProps({
    show: payload.show,
  })
}
const handleUpdateInputText = (payload: string) => {
  updateProps({
    calendarItem: {
      ...props.value.calendarItem,
      weight: payload,
    },
  })
}

const handleInputFocus = () => {
  weightBefore.value = props.value.calendarItem.weight
}

const handleCloseButtonClick = () => {
  updateProps({
    show: false,
  })
}

const validateForm = () => {
  const validList = [
    weightInputRef.value?.validateInput(),
  ]

  return !validList.some((isValid) => isValid === false)
}

const handleInputBlur = async () => {
  if (weightBefore.value === props.value.calendarItem.weight) return

  const isValid = validateForm()
  if (!isValid) return

  const result = await until(() => updateDailyRecord(props.value.calendarItem.dateTime, {
    date: props.value.calendarItem.dateTime.toISODate(),
    weight: Number(props.value.calendarItem.weight),
  }))
  if (result.error) {
    const toast = useToast()
    toast.error(result.error.message)
    return
  }

  emit('record-updated', { isTargetMonth: props.value.calendarItem.isTargetMonth })
}

const handleEnter = () => {
  customDialogRef.value?.handleBackgroundMaskClick()
}
</script>

<style lang="scss" scoped>
@use "@/style/colors.scss" as colors;
@use "@/style/font-sizes.scss" as font-sizes;
@use "@/style/constants.scss" as constants;

.calendar-item-dialog {
  display: grid;
  gap: 20px;
  justify-items: center;
  border-radius: constants.$border-radius;
  background-color: white;
  padding: 40px;

  .calendar-item-dialog-header {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 30px;
    align-items: center;

    .title {
      color: colors.$darkblue-600;
      font-size: font-sizes.$medium;
    }
  }

  .weight-input {
    width: 100%;
  }
}
</style>
