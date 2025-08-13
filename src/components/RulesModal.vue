<template>
  <div class="rules-modal-overlay" @click="closeModal" ref="overlay">
    <div class="rules-modal" ref="modal" @click.stop>
      <div class="modal-header">
        <div class="rule-banner">
          <span>RULE</span>
        </div>
      </div>

      <div class="modal-content">
        <div class="rules-list">
          <div class="rule-item" v-for="(rule, index) in rules" :key="index">
            <div class="rule-icon">•</div>
            <div class="rule-text-content">
              <span>{{ rule.number }} {{ rule.description }}</span>
              <span v-if="rule.extra" class="rule-extra">{{ rule.extra }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="close-button" @click="closeModal">
          <span class="close-text">CLOSE</span>
          <div class="button-glow"></div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';

const emit = defineEmits(['close']);

const overlay = ref<HTMLElement>();
const modal = ref<HTMLElement>();

const rules = [
  { number: '1st referral:', description: '1 draw' },
  { number: '2nd referral:', description: '3 draws' },
  { number: '3rd referral:', description: '5 draws' },
  { number: 'Nth referral:', description: '(2N - 1) draws', extra: '(no limit)' }
];

const closeModal = () => {
  if (modal.value) {
    modal.value.classList.add('modal-exit');
  }
  if (overlay.value) {
    overlay.value.classList.add('overlay-exit');
  }

  setTimeout(() => {
    emit('close');
  }, 600);
};

onMounted(async () => {
  await nextTick();
  // Small delay to ensure the initial state is visible before animation
  setTimeout(() => {
    if (modal.value) {
      modal.value.classList.add('modal-enter');
    }
    if (overlay.value) {
      overlay.value.classList.add('overlay-enter');
    }
  }, 50);
});
</script>

<style lang="scss" scoped>
.rules-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.6s ease;

  &.overlay-enter {
    opacity: 1;
  }

  &.overlay-exit {
    opacity: 0;
  }
}

.rules-modal {
  background: #ffffff;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 8px 16px rgba(0, 0, 0, 0.2);
  max-width: 90vw;
  width: 500px;
  max-height: 80vh;
  overflow: hidden;
  transform: scale(0.7) translateY(50px);
  opacity: 0;
  transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;

  &.modal-enter {
    transform: scale(1) translateY(0);
    opacity: 1;
  }

  &.modal-exit {
    transform: scale(0.8) translateY(30px);
    opacity: 0;
  }

  @media (max-width: 768px) {
    width: 90vw;
    max-width: 350px;
  }
}

.modal-header {
  padding: 1.5rem 2rem 1rem;
  text-align: center;
  position: relative;
}

.rule-banner {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  border-radius: 15px;
  padding: 0.8rem 1.5rem;
  display: inline-block;
  box-shadow:
    0 4px 12px rgba(220, 38, 38, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transform: perspective(1000px) rotateX(0deg);
  transition: all 0.3s ease;
  animation: bannerFloat 4s ease-in-out infinite;

  &:hover {
    transform: perspective(1000px) rotateX(5deg) translateY(-2px);
    box-shadow:
      0 6px 16px rgba(220, 38, 38, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
}

.rule-text {
  color: white;
  font-size: 1.5rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
}

.modal-content {
  padding: 1rem 2rem 1.5rem;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem;
  background: #ffffff;
  border-radius: 8px;
  border: 2px solid #ceffd0;
  transition: all 0.3s ease;
  animation: ruleItemSlide 0.6s ease-out both;
  margin-bottom: 0.5rem;

  &:hover {
    background: #f8fff8;
    border-color: #aaeec1;
    transform: translateX(3px);
    box-shadow: 0 2px 8px rgba(206, 255, 208, 0.3);
  }

  &:last-child {
    margin-bottom: 0;
  }

  @for $i from 1 through 4 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.1}s;
    }
  }
}

.rule-icon {
  font-size: 1.8rem;
  color: #374151;
  font-weight: 300;
  animation: iconPulse 2s ease-in-out infinite;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
}

.rule-text-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.rule-text-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.rule-text-content span {
  color: #374151;
  font-size: 1.1rem;
  font-weight: 400;
  line-height: 1.4;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
}

.rule-extra {
  margin-left: 0;
  font-size: 1.1rem !important;
  opacity: 0.8;

  @media (max-width: 768px) {
    font-size: 1rem !important;
  }
}

.modal-footer {
  padding: 1rem 2rem 1.5rem;
  text-align: center;
}

.close-button {
  position: relative;
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  background: linear-gradient(135deg, #374151, #1f2937);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transform: perspective(1000px) rotateX(0deg);

  &:hover {
    background: linear-gradient(135deg, #4b5563, #374151);
    border-color: rgba(255, 255, 255, 0.2);
    transform: perspective(1000px) rotateX(5deg) translateY(-2px) scale(1.05);
    box-shadow:
      0 6px 16px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  &:active {
    transform: perspective(1000px) rotateX(10deg) translateY(-1px) scale(0.95);
    box-shadow:
      0 3px 8px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .button-glow {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: buttonGlow 3s ease-in-out infinite;
  }

  .close-text {
    position: relative;
    z-index: 2;
  }
}

@keyframes modalGlow {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes bannerFloat {
  0%,
  100% {
    transform: perspective(1000px) rotateX(0deg) translateY(0);
  }
  50% {
    transform: perspective(1000px) rotateX(2deg) translateY(-3px);
  }
}

@keyframes ruleItemSlide {
  0% {
    opacity: 0;
    transform: translateX(-30px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes iconPulse {
  0%,
  100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

@keyframes buttonGlow {
  0% {
    left: -100%;
  }
  50% {
    left: 100%;
  }
  100% {
    left: 100%;
  }
}
</style>
