<template>
  <component
    :is="tag"
    :to="to"
    :href="href"
    :target="target"
    class="button"
    :class="{
      ...computedClasses,
      'b1s': size === 'lg',
      'b2s': size === 'md',
    }"
    :disabled="disabled"
  >
    <slot />
  </component>
</template>

<script>
const VALID_BUTTON_TYPES = ['sm', 'md', 'lg', 'xlg', 'icon'];

export default {
  props: {
    type: {
      type: String,
      default: 'primary',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    fluid: {
      type: Boolean,
      default: false,
    },
    inverse: {
      type: Boolean,
      default: false,
    },
    isPlain: {
      type: Boolean,
      default: false,
    },
    isInline: {
      type: Boolean,
      default: false,
    },
    size: {
      type: String,
      default: 'md',
      validator: (value) => VALID_BUTTON_TYPES.includes(value),
    },
    to: {
      type: String,
      default: null,
    },
    href: {
      type: String,
      default: null,
    },
    target: {
      type: String,
      default: null,
    },
  },
  computed: {
    tag: ({ to, href }) => {
      if (href) {
        return 'a';
      } if (to) {
        return 'router-link';
      }
      return 'button';
    },
    computedClasses: ({
      type, disabled, fluid, inverse, size, isPlain, isInline,
    }) => (
      {
        [`button--${type}`]: type,
        'button--disabled': disabled,
        'button--fluid': fluid,
        'button--inverse': inverse,
        [`button--${size}`]: size,
        'button--plain': isPlain,
        'button--inline': isInline,
      }
    ),
  },
};
</script>

<style lang="scss" scoped>
.b1s {
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
}

.b2s {
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

a {
  text-decoration: none;
}

.button {
  $this: &;

  display: block;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: none;
  border-radius: 10px;
  outline: none;
  transition: background-color 0.2s;

  &:hover {
    cursor: pointer;
  }

  &--primary {
    color: white;
    background: var(--primary);

    &:hover {
      background: var(--primary-200);
    }

    &:active {
      background: var(--primary-300);
    }

    &#{$this}--disabled {
      cursor: not-allowed;
      background: var(--primary-disabled);
    }
  }

  &--secondary {
    color: var(--dark);
    background: var(--light);
    border: 1px solid var(--grey-200);

    &:hover {
      background: var(--grey-100);
    }

    &:active {
      background: var(--grey-150);
    }

    &#{$this}--disabled {
      color: var(--grey-500);
      cursor: not-allowed;
    }
  }

  &--error {
    color: var(--light);
    background: var(--error);

    &:hover {
      background: var(--error-200);
    }

    &:active {
      background: var(--error-300);
    }

    &#{$this}--disabled {
      cursor: not-allowed;
      background: var(--error-disabled);
    }
  }

  &--md {
    padding: 10px 20px;

    &#{$this}--secondary {
      padding: 9px 20px;
    }

    &#{$this}--singleIcon {
      padding: 8px;
    }
  }

  &--lg {
    padding: 12px 20px;

    &#{$this}--secondary {
      padding: 11px 20px;
    }
  }

  &--icon {
    padding: 7px;
  }

  &--fluid {
    width: 100%;
  }

  &--inverse {
    color: var(--primary);
    background: var(--light);

    &:hover {
      background: var(--light);
    }
  }

  &--plain {
    color: var(--dark);
    background: transparent;

    &:hover {
      color: var(--dark);
      background: transparent;
    }
  }

  &--inline {
    display: inline;
    padding: 0;
    font-weight: normal;
    color: var(--primary-100);
    background: transparent;

    &:hover {
      color: var(--primary-100);
      background: transparent;
    }
  }
}
</style>
