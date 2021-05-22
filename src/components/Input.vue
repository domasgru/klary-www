<template>
  <InputWrapper
    v-if="!hasSubmitedEmail"
    ref="inputWrapperRef"
    class="email-input"
    :error="error"
  >
    <input
      v-model="email"
      class="email-input__input"
      type="text"
      spellcheck="false"
      placeholder="Your email address"
      @keydown.enter="submitEmail"
      @input="error = null"
      @blur="error = null"
    >
    <button
      class="email-input__button"
      @click="submitEmail"
    >
      <ArrowRight />
    </button>
  </InputWrapper>
  <div
    v-else
    class="email-input__success-message"
  >
    Woo-hoo! We will contant with you soon 🙌
  </div>
</template>

<script setup="props, {}">
import {ref} from 'vue'
import ArrowRight from '../assets/svg/arrow-right.svg'
import InputWrapper from './InputWrapper.vue'
import {validateEmail} from '../utils/validate'

const inputWrapperRef = ref(null)
const error = ref(null)
const email = ref('')
const hasSubmitedEmail = ref(false)
const setError = (message) => {
  error.value = message
  inputWrapperRef.value.handleSubmitKeyDown()
}
const submitEmail = async () => {
  if(!email.value) {
    setError('Enter your email')
    window.umami.trackEvent(email.value, 'submit-email-empty-email')
    return
  }

  if(!validateEmail(email.value)) {
    setError('Please enter valid email')
    window.umami.trackEvent(email.value, 'submit-email-invalid-email')
    return
  }

  try {
    const response = await fetch('https://qumwrdaeeznvdjultimn.supabase.co/rest/v1/emails', {
      method: 'POST',
      headers: {
        'apiKey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMTY3MDQ4NCwiZXhwIjoxOTM3MjQ2NDg0fQ.TXbkY4nhx7yXJav9HiKPth8blBZtdHW62Cgd0J9agWc',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMTY3MDQ4NCwiZXhwIjoxOTM3MjQ2NDg0fQ.TXbkY4nhx7yXJav9HiKPth8blBZtdHW62Cgd0J9agWc',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ email: email.value })
    })

    if(response.status !== 201) {
      setError('Something went wrong. Try again.')
      return
    }

    hasSubmitedEmail.value = true;
    window.umami.trackEvent(email.value, 'submit-email')
  } catch(error) {
    setError('Something went wrong. Try again.')
    window.umami.trackEvent(email.value, 'submit-email-server-error')
    console.error(error)
  }
}
</script>

<style lang="scss" scoped>
.email-input {
  width: 100%;
  max-width: 400px;

  &__input {
    width: 100%;
    padding: 15px 64px 15px 16px;
    font-size: 16px;
    line-height: 24px;

    &::placeholder {
      color: #919199;
    }
  }

  &__button {
    position: absolute;
    top: 7px;
    right: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    background: var(--primary);
    border-radius: 10px;

    &:hover {
      cursor: pointer;
      background: var(--primary-200);
    }
  }

  &__success-message {
    padding: 16px 24px 16px 20px;
    font-size: 16px;
    line-height: 24px;
    color: var(--primary);
    background: var(--primary-light-10);
    border-radius: 10px;
  }
}
</style>