<template>
    <div class="out-of-stock-modal-overlay" @click="closeModal" ref="overlay">
        <div class="out-of-stock-modal" ref="modal" @click.stop>
            <div class="modal-header">
                <div class="out-of-stock-banner">
                    <span>OUT OF STOCK</span>
                </div>
            </div>

            <div class="modal-content">
                <div class="out-of-stock-icon">📦</div>
                <div class="out-of-stock-message">
                    <h3>All Products Are Currently Out of Stock</h3>
                    <p>
                        We apologize, but all the products in our lucky draw are currently
                        unavailable. Please check back later for new stock!
                    </p>
                </div>
            </div>

            <div class="modal-footer">
                <button class="close-button" @click="closeModal">
                    <span class="close-text">UNDERSTOOD</span>
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
.out-of-stock-modal-overlay {
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

.out-of-stock-modal {
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

.out-of-stock-banner {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border-radius: 15px;
    padding: 0.8rem 1.5rem;
    display: inline-block;
    box-shadow:
        0 4px 12px rgba(245, 158, 11, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transform: perspective(1000px) rotateX(0deg);
    transition: all 0.3s ease;
    animation: bannerFloat 4s ease-in-out infinite;

    &:hover {
        transform: perspective(1000px) rotateX(5deg) translateY(-2px);
        box-shadow:
            0 6px 16px rgba(245, 158, 11, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }

    span {
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
}

.modal-content {
    padding: 2rem;
    text-align: center;
}

.out-of-stock-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    animation: iconBounce 2s ease-in-out infinite;
}

.out-of-stock-message {
    h3 {
        color: #374151;
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 1rem;
        line-height: 1.3;

        @media (max-width: 768px) {
            font-size: 1.3rem;
        }
    }

    p {
        color: #6b7280;
        font-size: 1.1rem;
        line-height: 1.6;
        margin: 0;

        @media (max-width: 768px) {
            font-size: 1rem;
        }
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

@keyframes iconBounce {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-10px);
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
