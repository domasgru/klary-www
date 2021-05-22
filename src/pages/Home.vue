<template>
  <div
    class="scroll"
  >
    <main
      class="main"
    >
      <div class="main__logo">
        <img
          src="../assets/images/klaryLogo.png"
          alt="Logo symbol"
          class="main__logo-symbol"
        >
        <LogoText class="main__logo-text" />
      </div>
      <div class="main__content">
        <div class="main__left">
          <div class="main__left-content">
            <h1 class="main__title">
              The new way of sharing feedback
            </h1>
            <p class="main__subtitle">
              Be the first to know about our beta release by leaving your email.
            </p>
            <Input class="main__email-input" />
          </div>
        </div>
        <div
          class="main__right"
          :class="{
            'show-only-image': !isAppInitialized,
            'pulse': isAppInitialized
          }"
        >
          <img
            class="main__dashboard-image"
            src="/images/dashboard.png"
            alt="Dashboard"
          >
          <div class="main__right main__right-absolute">
            <canvas
              id="canvas3d"
              class="main__canvas"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import {ref} from 'vue'
import LogoText from '../assets/svg/klaryLogoText.svg';
import Input from '../components/Input.vue'

const isAppInitialized = ref(false)

if (!import.meta.env.SSR) {
  const canvasElement = document.getElementById('canvas3d');
  const wrapper = document.querySelector('.main__right');

  const resizeObserver = new ResizeObserver(async ([entry]) => {
    // debugger
    const { width, height } = Array.isArray(entry.contentRect) ? entry.contentRect[0] : entry.contentRect;
    if ((height / width) > 0.9) {
      isAppInitialized.value = true;
    }
  });

  if(canvasElement) {
    resizeObserver.observe(canvasElement);
  }
 

  // eslint-disable-next-line no-undef
  const app = new SpeRuntime.Application();
  app.start('./scene.json');
}
</script>

<style lang="scss" scoped>
.pulse {
  box-shadow: 0 0 0 0 rgba(81, 31, 220, 0.2);
  animation: pulse 0.3s ease;
}

@keyframes pulse {
  to {
    box-shadow: 0 0 0 12px rgba(81, 31, 220, 0);
  }
}

.hide {
  height: 0;
  opacity: 0;
}

.scroll {
  width: 100%;
  height: 100%;
  max-height: 100vh;
}

.main {
  height: 100%;
  padding: 32px;
  background: var(--light);
}

.main__logo {
  position: absolute;
  top: 64px;
  left: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main__logo-symbol {
  width: 40px;
  margin-right: 7px;
}

.main__logo-image {
  margin-right: 10px;
}

.main__content {
  display: flex;
  width: 100%;
  height: 100%;
}

.main__left,
.main__right {
  flex: 1;
  height: 100%;
}

.main__left {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 48px;
}

.main__left-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  max-width: 416px;
}

.main__title {
  margin-bottom: 20px;
  font-size: 48px;
  font-weight: bold;
  line-height: 56px;
  color: #17171a;
}

.main__subtitle {
  margin-bottom: 32px;
  font-size: 20px;
  font-weight: normal;
  line-height: 28px;
  color: #787880;
}

.main__right {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  padding-left: 64px;
  overflow: hidden;
  background: linear-gradient(31.46deg, #ece6ff 0%, #f9e6ff 98.96%);
  border-radius: 16px;
}

.main__right-absolute {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 1;
}

.show-only-image .main__dashboard-image {
  opacity: 1;
}

.show-only-image .main__right-absolute {
  opacity: 0;
}

.main__dashboard-image {
  width: 100%;
  opacity: 0;
}

.main__canvas {
  flex-basis: inherit;
  width: 100% !important;
  height: auto !important;
  border: none;
  outline: 0;
  object-fit: cover;
  object-position: center;
}

@media screen and (max-width: 720px) {
  .scroll {
    max-height: 100vh;
    overflow-y: auto;
  }

  .main {
    height: auto;
    padding: 32px 24px;
  }

  .main__content {
    flex-direction: column;
  }

  .main__logo {
    position: static;
    margin-bottom: 64px;
  }

  .main__left,
  .main__right {
    flex: 0;
    height: auto;
    text-align: center;
  }

  .main__left {
    align-items: center;
    padding: 0;
  }

  .main__title {
    font-size: 40px;
    line-height: 48px;
  }

  .main__subtitle {
    font-size: 16px;
    line-height: 24px;
  }

  .main__email-input {
    margin-bottom: 64px;
  }

  .main__right {
    padding: 34px 0;
  }
}
</style>
