<template>
  <div class="base-input-wrapper">
    <div
      class="base-input"
      :class="{
        'base-input--error': error,
        'base-input--success': success,
        'base-input--disabled': isDisabled,
        'base-input--liftUpAnimation': animateLiftUp
      }"
      @animationend="animateLiftUp = false"
    >
      <label
        v-if="label"
        :for="`input${$.uid}`"
        class="base-input__label base-typography--caption"
      >
        {{ label }}
      </label>
      <div
        class="base-input__input-wrapper"
        :style="styleVariables"
        :class="{'base-input__input-wrapper--pulse': inputPulseAnimation}"
        @animationend="inputPulseAnimation = false"
      >
        <slot />
      </div>
    </div>
    <span
      v-if="showHintArea"
      class="base-input-hint caption"
      :class="{
        'base-input-hint--error': error,
        'base-input-hint--success': success,
      }"
    >
      {{ hint || error || success }}
    </span>
  </div>
</template>

<script>
export default {
  props: {
    label: {
      type: String,
      default: '',
    },
    hint: {
      type: String,
      default: undefined,
    },
    error: {
      type: String,
      default: undefined,
    },
    success: {
      type: String,
      default: undefined,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    hasConsistentHeight: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      animateLiftUp: false,
      inputPulseAnimation: false,
    };
  },
  computed: {
    showHintArea() {
      return this.hint || this.error || this.success || this.hasConsistentHeight;
    },
    styleVariables() {
      let outlineColor = 'rgba(81, 31, 220, 0.2)';
      let outlineColorEnd = 'rgba(81, 31, 220, 0)';
      if (this.error) {
        outlineColor = 'rgba(217, 47, 43, 0.2)';
        outlineColorEnd = 'rgba(217, 47, 43, 0)';
      }
      return {
        '--outlineColor': outlineColor,
        '--outlineColorEnd': outlineColorEnd,
      };
    },
  },
  watch: {
    error(newValue) {
      if (!newValue) {
        return;
      }
      this.handleSubmitKeyDown();
    },
  },
  methods: {
    handleSubmitKeyDown() {
      if (!this.error) {
        return;
      }

      if (this.animateLiftUp) {
        this.animateLiftUp = false;
      }

      if (this.inputPulseAnimation) {
        this.inputPulseAnimation = false;
      }

      this.animateLiftUp = true;
      this.inputPulseAnimation = true;
    },
  },
};
</script>

<style lang="scss" scoped>
.base-input-wrapper {
  position: relative;
  width: 100%;
}

.base-input {
  $this: &;

  width: 100%;

  &--liftUpAnimation {
    animation: liftUp 0.2s ease;
  }

  &__label {
    display: block;
    padding-bottom: 8px;
  }

  &__input-wrapper {
    position: relative;
    display: flex;
    overflow: hidden;
    background: var(--light);
    border: 1px solid transparent;
    border: 1px solid var(--grey-200);
    border-radius: 10px;
    box-shadow: 0 0 0 0 var(--outlineColor);
    transition: all 0.15s ease;

    &:hover {
      border: 1px solid var(--grey-300);
    }

    &:focus,
    &:focus-within {
      border: 1px solid var(--primary);
      box-shadow: 0 0 0 4px var(--outlineColor);
    }

    &--pulse {
      animation: pulse 0.4s ease;
    }

    #{$this}--error & {
      background: var(--error-light);
      border: 1px solid var(--error);
    }

    #{$this}--success & {
      background: var(--success-light);
      border: 1px solid var(--success);
    }

    #{$this}--disabled & {
      color: var(--grey-600);
      background: var(--grey-50);
    }
  }
}

.base-input-hint {
  position: absolute;
  bottom: -28px;
  left: 0;
  display: block;
  width: 100%;
  height: 20px;
  font-size: 14px;
  line-height: 20px;
  color: var(--grey-500);

  &--success {
    color: var(--success);
  }

  &--error {
    color: var(--error);
  }
}

@keyframes liftUp {
  0% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-3px);
  }

  100% {
    transform: translateY(0);
  }
}

@keyframes pulse {
  to {
    box-shadow: 0 0 0 12px var(--outlineColorEnd);
  }
}
</style>
