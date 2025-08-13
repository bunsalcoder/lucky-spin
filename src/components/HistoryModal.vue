<template>
  <div class="history-modal-overlay" @click="closeModal" ref="overlay">
    <div class="history-modal" ref="modal" @click.stop>
      <div class="modal-header">
        <div class="history-banner">
          <span class="history-text">HISTORY</span>
        </div>
      </div>

      <div class="modal-content">
        <div class="history-table">
          <div class="table-header">
            <div class="header-cell">NO.</div>
            <div class="header-cell">Date</div>
            <div class="header-cell">Win</div>
          </div>

          <div class="table-body">
            <div class="table-row" v-for="(item, index) in historyItems" :key="index">
              <div class="table-cell">{{ item.no }}</div>
              <div class="table-cell">{{ item.date }}</div>
              <div class="table-cell">{{ item.win }}</div>
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

const historyItems = [
  { no: '01', date: '11.08.25', win: 'iPhone' },
  { no: '02', date: '11.08.25', win: 'Iped' },
  { no: '03', date: '11.08.25', win: 'Printer' },
  { no: '04', date: '11.08.24', win: 'Laptop' },
  { no: '05', date: '11.08.24', win: 'MPOS Umbrella' },
  { no: '06', date: '11.08.24', win: 'Store Promotional Video' },
  { no: '07', date: '11.08.23', win: '10 rolls of thermal paper' },
  { no: '08', date: '11.08.23', win: 'MPOS tissue box' },
  { no: '09', date: '11.08.23', win: 'iPhone' },
  { no: '10', date: '11.08.22', win: 'Laptop' },
  { no: '11', date: '11.08.22', win: 'Printer' },
  { no: '12', date: '11.08.22', win: 'MPOS Umbrella' },
  { no: '13', date: '11.08.21', win: 'Store Promotional Video' },
  { no: '14', date: '11.08.21', win: '10 rolls of thermal paper' },
  { no: '15', date: '11.08.21', win: 'MPOS tissue box' }
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
.history-modal-overlay {
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

.history-modal {
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
  transform: scale(0.5) translateY(100px);
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
    max-width: 400px;
  }
}

.modal-header {
  padding: 1.5rem 2rem 1rem;
  text-align: center;
  position: relative;
}

.history-banner {
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

.history-text {
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
  max-height: 50vh;
  overflow: hidden;
}

.history-table {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #f9fafb;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-header {
  display: grid;
  grid-template-columns: 0.8fr 1fr 1.5fr;
  background: linear-gradient(135deg, #ceffd0, #aaeec1);
  border-bottom: 2px solid #e5e7eb;
  flex-shrink: 0;
}

.header-cell {
  padding: 1rem;
  font-weight: 700;
  color: #089a08;
  text-align: center;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 1px;

  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 0.8rem;
  }
}

.table-body {
  background: white;
  flex: 1;
  overflow-y: auto;
  max-height: 30vh;
}

.table-row {
  display: grid;
  grid-template-columns: 0.8fr 1fr 1.5fr;
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f3f4f6;
  }
}

.table-cell {
  padding: 1rem;
  text-align: center;
  color: #374151;
  font-weight: 500;
  font-size: 1rem;

  @media (max-width: 768px) {
    font-size: 0.9rem;
    padding: 0.8rem;
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

@keyframes bannerFloat {
  0%,
  100% {
    transform: perspective(1000px) rotateX(0deg) translateY(0);
  }
  50% {
    transform: perspective(1000px) rotateX(2deg) translateY(-3px);
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
