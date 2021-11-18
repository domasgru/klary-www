<template>
  <div class="scroll">
    <main class="main">
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
              Unleash the power of feedback
            </h1>
            <p class="main__subtitle">
              Give, receive and clarify feedback in one place. Join the waitlist to get early access.
            </p>
            <!-- <BaseButton
              class="main__get-started-button"
              size="lg"
              href="https://app.klary.co/login"
            >
              Get started
            </BaseButton>
            <div class="main__get-started-mobile">
              Use desktop device to get started 🙏
            </div> -->
            <Input class="main__input" />
            <a
              href="#story"
              class="main__story-link"
            >
              <div class="mr-8"> Why we’re creating Klary? </div>
              <ArrowDown />
            </a>
          </div>
        </div>
        <div
          class="main__right"
          :class="{
            'show-only-image': !isAppInitialized,
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
    <div
      id="story"
      class="story"
    >
      <h2 class="h2 story__title">
        Why we are creating Klary:
      </h2>
      <div class="story__container">
        <div class="story__step">
          <div class="story__card">
            1. Feedback is essential for growth.
          </div>
          <Arrow1 class="story__arrow-1" />
        </div>
        <div class="story__step">
          <div class="story__card">
            <div class="mb-32">
              2. While sharing feedback we:
            </div>
            <ul class="mb-16">
              <li>Ask for feedback</li>
              <li>Get to know received feedback</li>
            </ul>
            <div class="story__optional mb-16">
              Optional, but very powerful ⬇️
            </div>
            <ul>
              <li>Clarify or dive deeper with feedback giver</li>
              <li>Create action items</li>
              <li>Organise feedback and action items</li>
            </ul>
          </div>
          <Arrow2 class="story__arrow-2" />
        </div>
        <div class="story__step">
          <div class="story__card">
            3. The better we do these steps - the more value we get from feedback, the more we grow.
          </div>
          <Arrow3 class="story__arrow-3" />
        </div>
        <div class="story__step">
          <div class="story__card">
            <div class="mb-32">
              4. While actively sharing feedback, we've identified a few main problems:
            </div>
            <ul>
              <li class="mb-16">
                The process gets scattered across multiple platforms. 
                To ask for feedback we use some form apps, to clarify we go to a messaging app, to take notes we use yet another app.
              </li>
              <li>
                None of those platforms are dedicated for sharing feedback. 
                Form apps are more for massive surveys, messaging apps are more for day-to-day communication, 
                so sharing or clarifying feedback easily drowns in daily work-related chats.
              </li>
            </ul>
          </div>
          <Arrow4 class="story__arrow-4" />
        </div>
        <div class="story__step">
          <div class="story__card">
            5. We started creating Klary with the goal to build a complete platform for feedbacks 
            that brings together the whole process and is fully dedicated to feedbacks.
          </div>
        </div>
      </div>
    </div>
    <div class="join">
      <div class="join__title h2">
        Join the waitlist to get early access
      </div>
      <Input />
    </div>
    <footer class="footer">
      <a
        href="https://twitter.com/KlaryApp"
        title="Twitter link"
        target="_blank"
        class="footer__twitter-link"
      >
        <TwitterLogo class="mr-8" /> Follow us on twitter
      </a>
    </footer>
  </div>
</template>

<script setup>
import {ref} from 'vue'
import LogoText from '../assets/svg/klaryLogoText.svg';
import Arrow1 from '../assets/svg/arrow1.svg'
import Arrow2 from '../assets/svg/arrow2.svg'
import Arrow3 from '../assets/svg/arrow3.svg'
import Arrow4 from '../assets/svg/arrow4.svg'
import TwitterLogo from '../assets/svg/twitter.svg'
import ArrowDown from '../assets/svg/arrow-down.svg'
import BaseButton from '../components/BaseButton.vue'
import Input from '../components/Input.vue'

const isAppInitialized = ref(false)

if (!import.meta.env.SSR) {
  const canvasElement = document.getElementById('canvas3d');
  const wrapper = document.querySelector('.main__right');

  const resizeObserver = new ResizeObserver(async ([entry]) => {
    // debugger
    const { width, height } = Array.isArray(entry.contentRect) ? entry.contentRect[0] : entry.contentRect;
    if ((height / width) > 0.9 && window.devicePixelRatio > 1) {
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
ul li {
  list-style-position: inside;
}

ul:not(:last-child) {
  margin-bottom: 16px;
}

.pulse {
  box-shadow: 0 0 0 0 rgba(81, 31, 220, 0.2);
  animation: pulse 0.3s ease;
}

.h2 {
  font-size: 48px;
  font-weight: bold;
  line-height: 56px;
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
  position: relative;
  max-width: 1400px;
  padding: 32px;
  margin: auto;
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
  min-height: 660px;
}

.main__left,
.main__right {
  flex: 1;
  //height: 100%;
}

.main__left {
  display: flex;
  flex-direction: column;
  //justify-content: center;
  padding: 0 48px;
  margin-top: 200px;
}

.main__left-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  max-width: 440px;
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

.main__story-link {
  display: flex;
  align-items: center;
  margin-top: 32px;
  margin-bottom: 64px;
  font-size: 16px;
  line-height: 24px;
  color: var(--primary);
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

.main__get-started-mobile {
  display: none;
}

.story {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 128px;
  margin-bottom: 160px;
  color: var(--dark);
}

.story__title {
  max-width: 700px;
  margin-bottom: 80px;
  text-align: center;
}

.story__container {
  display: flex;
  flex-direction: column;
  align-items: start;
  width: 100%;
  max-width: 792px;
}

.story__step {
  //width: 100%;
  position: relative;
}

.story__step:not(:last-child) {
  margin-bottom: 64px;
}

.story__card {
  width: 100%;
  padding: 40px 48px;
  font-size: 20px;
  line-height: 28px;
  background: var(--light);
  border: 1px solid var(--grey-100);
  border-radius: 16px;
  box-shadow: 0 10px 20px rgba(23, 23, 25, 0.08);
}

.story__optional {
  color: var(grey-500);
}

.mb-16 {
  margin-bottom: 16px;
}

.mb-32 {
  margin-bottom: 32px;
}

.story__step:nth-child(1) {
  max-width: 430px;
  margin-left: 48px;
  transform: rotate(-1deg);
}

.story__step:nth-child(2) {
  max-width: 523px;
  margin-right: 35px;
  margin-left: auto;
  transform: rotate(1.5deg);
}

.story__step:nth-child(3) {
  max-width: 547px;
  transform: rotate(-1deg);
}

.story__step:nth-child(4) {
  max-width: 606px;
  margin-left: auto;
  transform: rotate(1deg);
}

.story__step:nth-child(5) {
  max-width: 622px;
  margin-left: 48px;
  transform: rotate(-1.5deg);
}

.story__arrow-1 {
  position: absolute;
  top: 51px;
  right: -153px;
  margin: auto;
}

.story__arrow-2 {
  position: absolute;
  top: 222px;
  left: -153px;
}

.story__arrow-3 {
  position: absolute;
  top: 68px;
  right: -132px;
}

.story__arrow-4 {
  position: absolute;
  top: 318px;
  left: -90px;
}

.join {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  text-align: center;
}

.join__title {
  max-width: 600px;
  margin-bottom: 40px;
}

.footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 232px;
  padding-bottom: 48px;
  background: linear-gradient(180deg, #fff 0%, rgba(255, 255, 255, 0) 100%), linear-gradient(31.46deg, #ece6ff 0%, #f9e6ff 98.96%);
}

.footer__twitter-link {
  display: flex;
  align-items: center;
  margin-top: auto;
  font-size: 16px;
  line-height: 24px;
  color: var(--primary);
}

.mr-8 {
  margin-right: 8px;
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
    margin: 0;
  }

  .main__left-content {
    align-items: center;
  }

  .main__title {
    font-size: 40px;
    line-height: 48px;
  }

  .main__subtitle {
    font-size: 16px;
    line-height: 24px;
  }

  .main__get-started-button {
    display: none;
  }

  .main__get-started-mobile {
    display: block;
    padding: 8px 16px;
    margin-bottom: 64px;
    line-height: 24px;
    background: var(--grey-100);
    border-radius: 10px;
  }

  .main__right {
    padding: 34px 0;
  }

  .story {
    padding-top: 88px;
    padding-right: 24px;
    padding-left: 24px;
    margin-bottom: 120px;
  }

  .story__card {
    font-size: 16px;
    line-height: 24px;
  }

  .story__title {
    max-width: 366px;
    margin-bottom: 48px;
  }

  .story__step {
    width: 100%;
    max-width: none !important;
    margin: 0 !important;
    transform: rotate(0) !important;
  }

  .story__step:not(:last-child) {
    margin-bottom: 24px !important;
  }

  .story__arrow-1,
  .story__arrow-2,
  .story__arrow-3,
  .story__arrow-4 {
    display: none;
  }

  .join {
    padding: 0 24px;
  }

  .footer {
    height: 192px;
  }

  .h2 {
    font-size: 32px;
    line-height: 40px;
  }
}
</style>
