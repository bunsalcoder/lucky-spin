<template>
    <Toast position="bottom-left" />
    <ConfirmPopup id="confirm" aria-label="popup">
        <template #message="slotProps">
            <div class="flex flex-column align-items-center w-full gap-3 p-3">
                <i class="text-6xl" :class="slotProps.message.icon"></i>
                <span>{{ slotProps.message.message }}</span>
            </div>
        </template>
    </ConfirmPopup>
    <ScrollPanel class="h-screen" style="overflow: hidden">
        <div class="max-w-screen" style="overflow: hidden">
            <div class="main-container">
                <div class="title-container">
                    <h1 class="main-title">
                        <span class="title-text">REFER MORE</span>
                        <span class="title-separator">,</span>
                        <span class="title-text">WIN MORE</span>
                    </h1>
                    <div class="coin-and-buttons-container">
                        <button class="action-button rule-button" @click="showRules">
                            <span class="button-text">RULE</span>
                            <div class="button-glow"></div>
                        </button>
                        <div class="coin-container">
                            <div class="coin-icon">🪙</div>
                            <span class="coin-number">: {{ coin }}</span>
                        </div>
                        <button class="action-button history-button" @click="showHistory">
                            <span class="button-text">HISTORY</span>
                            <div class="button-glow"></div>
                        </button>
                    </div>
                </div>

                <div class="wheel-container">
                    <div v-if="!authCompleted" class="loading-overlay">
                        <div class="loading-spinner"></div>
                        <p>Initializing...</p>
                    </div>
                    <SpinWheel
                        :products="products"
                        :award="award"
                        :award-loading="awardLoading"
                        @request-award="requestAward"
                        @clear-award="handleClearAward"
                        v-else
                    ></SpinWheel>
                </div>
            </div>
        </div>
        <Footer></Footer>
    </ScrollPanel>

    <!-- Rules Modal -->
    <RulesModal v-if="showRulesModal" @close="hideRules" />

    <!-- History Modal -->
    <HistoryModal v-if="showHistoryModal" @close="hideHistory" />

    <DynamicDialog />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import RulesModal from '@/components/RulesModal.vue';
import HistoryModal from '@/components/HistoryModal.vue';
import { useProducts } from '@/composables/useProducts';
import { useCoin } from '@/composables/useCoin';
import { useAward } from '@/composables/useAward';
import { initializeLogin, waitForAuthentication } from '@/services/MosAuthService';

declare global {
    interface Navigator {
        globalPrivacyControl?: boolean;
    }
}

const showRulesModal = ref(false);
const showHistoryModal = ref(false);

// Initialize products
const {
    loadProductsForWheel,
    products,
    loading: productsLoading,
    error: productsError
} = useProducts();

// Initialize coin
const { loadCoin, coin, enable, loading: coinLoading, error: coinError } = useCoin();

// Initialize award
const { requestAward, award, loading: awardLoading, error: awardError, clearAward } = useAward();

// Authentication and product loading state
const authCompleted = ref(false);

const showRules = () => {
    showRulesModal.value = true;
};

const hideRules = () => {
    showRulesModal.value = false;
};

const showHistory = () => {
    showHistoryModal.value = true;
};

const hideHistory = () => {
    showHistoryModal.value = false;
};

const handleClearAward = async () => {
    clearAward();
    // Refresh coin after award is cleared
    await loadCoin();
};

onMounted(async () => {
    // Wait for token and load products
    const waitForTokenAndLoadProducts = async () => {
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds

        while (attempts < maxAttempts) {
            attempts++;

            const token = localStorage.getItem('luckyWheelToken');
            if (token) {
                authCompleted.value = true;

                try {
                    // Load both products and coin data
                    await Promise.all([loadProductsForWheel(), loadCoin()]);
                    return;
                } catch (error) {
                    console.error('Failed to load data:', error);
                }
            }

            // Wait 1 second before next attempt
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    };

    // Start the process
    waitForTokenAndLoadProducts();

    if (import.meta.env.DEV) {
        // Add dummy gtag for dev
        window.gtag = (...args: any[]) => {
            console.debug('gtag', ...args);
        };
    } else if (navigator.globalPrivacyControl) {
        // Don't track if user has enabled Global Privacy Control
        window.gtag = () => {};
        console.log(
            '%cWe can see that you have enabled the Global Privacy Control, indicating that you do not wish to have your information sold or shared.',
            'font-weight:bold; color: lightgreen;',
            '\nYour privacy is important to us, and we completely honor your choice.',
            'As a result, we have deactivated Google Analytics and Microsoft Clarity. 😉'
        );
    } else if (navigator.userAgent.indexOf('OBS') > 0) {
        // Don't track in OBS mode to reduce performance impact
        window.gtag = () => {};
    } else if (import.meta.env.PROD) {
        // Setup GA
        (function (id) {
            const gtagScript = document.createElement('script');
            gtagScript.async = true;
            gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;

            document.head.appendChild(gtagScript);

            const dataLayerScript = document.createElement('script');
            dataLayerScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${id}');`;
            document.head.appendChild(dataLayerScript);
        })(import.meta.env.VITE_GA_TRACKING_ID);

        // Setup Clarity
        (function (c: any, l: Document, a: string, r: string, i: string, t: any, y: any) {
            c[a] =
                c[a] ||
                function (...args: any[]) {
                    (c[a].q = c[a].q || []).push(args);
                };
            t = l.createElement(r);
            t.async = 1;
            t.src = 'https://www.clarity.ms/tag/' + i;
            y = l.getElementsByTagName(r)[0];
            y.parentNode.insertBefore(t, y);
        })(
            window,
            document,
            'clarity',
            'script',
            import.meta.env.VITE_CLARITY_TRACKING_ID,
            undefined,
            undefined
        );
    }
});
</script>

<style lang="scss" scoped>
.main-container {
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
}

.title-container {
    position: absolute;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    z-index: 10;
}

.coin-and-buttons-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    margin-top: 1rem;

    @media (max-width: 768px) {
        gap: 1.5rem;
    }

    @media (max-width: 480px) {
        gap: 1rem;
    }
}

.main-title {
    position: relative;
    padding: 1rem 2rem;
    border: none;
    border-radius: 50px;
    font-size: 1.8rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.3s ease;
    overflow: hidden;
    box-shadow:
        0 8px 25px rgba(0, 0, 0, 0.3),
        0 4px 8px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transform: perspective(1000px) rotateX(0deg);
    animation: buttonFloat 4s ease-in-out infinite;
    margin: 0;

    @media (max-width: 768px) {
        padding: 0.8rem 1.5rem;
        font-size: 1.5rem;
    }

    @media (max-width: 480px) {
        padding: 0.6rem 1.2rem;
        font-size: 1.2rem;
    }

    /* Small height devices */
    @media (max-height: 800px) {
        padding: 0.5rem 1rem;
        font-size: 1rem;
    }

    &:hover {
        transform: perspective(1000px) rotateX(5deg) translateY(-3px) scale(1.05);
        box-shadow:
            0 12px 35px rgba(0, 0, 0, 0.4),
            0 6px 12px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        animation-play-state: paused;
    }

    &:active {
        transform: perspective(1000px) rotateX(10deg) translateY(-1px) scale(0.95);
        box-shadow:
            0 6px 20px rgba(0, 0, 0, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }
}

/* Main title button styling to match rule and history buttons */
.main-title {
    background: linear-gradient(135deg, #212f56, #1a2332);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.1);
    animation-delay: 0s;

    &:hover {
        background: linear-gradient(135deg, #2d3f6b, #212f56);
        border-color: rgba(255, 255, 255, 0.2);
    }

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        animation: buttonGlow 3s ease-in-out infinite;
    }
}

.title-text {
    display: inline-block;
    color: white;
    animation: titleBounce 3s ease-in-out infinite;

    &:nth-child(3) {
        animation-delay: 0.5s;
    }
}

.title-separator {
    color: white;
    text-shadow: none;
    animation: separatorPulse 2s ease-in-out infinite;
}

.coin-container {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1rem;
    gap: 0.5rem;
    animation: coinShine 3s ease-in-out infinite;
    width: 120px;
    flex-direction: row;
    flex-wrap: nowrap;

    /* Small height devices */
    @media (max-height: 800px) {
        margin-top: 30px;
        gap: 0.3rem;
    }
}

.coin-icon {
    font-size: 3rem;
    filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.9));
    animation: coinRotate 4s linear infinite;
    display: flex;
    align-items: center;
    justify-content: center;

    @media (max-width: 768px) {
        font-size: 2.5rem;
    }

    @media (max-width: 480px) {
        font-size: 2rem;
    }

    /* Small height devices */
    @media (max-height: 800px) {
        font-size: 1.5rem;
    }
}

.coin-number {
    font-size: 2rem;
    font-weight: bold;
    color: #ffffff;
    // text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    animation: numberPulse 2s ease-in-out infinite;
    // display: flex;
    // align-items: center;
    // justify-content: center;
    // line-height: 1;

    @media (max-width: 768px) {
        font-size: 1.8rem;
    }

    @media (max-width: 480px) {
        font-size: 1.5rem;
    }

    /* Small height devices */
    @media (max-height: 800px) {
        font-size: 1.2rem;
    }
}

.confetti-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.confetti {
    position: absolute;
    width: 60px;
    height: 60px;
    background: linear-gradient(45deg, #22c55e, #16a34a);
    border-radius: 50%;
    animation: confettiFloat 4s ease-in-out infinite;

    &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        background: linear-gradient(45deg, #16a34a, #15803d);
        border-radius: 50%;
    }

    &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 20px;
        background: #ffffff;
        border-radius: 50%;
    }
}

.confetti-left {
    left: -80px;
    animation-delay: 0s;
}

.confetti-right {
    right: -80px;
    animation-delay: 2s;
}

.wheel-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.action-button {
    position: relative;
    padding: 1rem 2rem;
    border: none;
    border-radius: 50px;
    font-size: 1.2rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.3s ease;
    overflow: hidden;
    box-shadow:
        0 8px 25px rgba(0, 0, 0, 0.3),
        0 4px 8px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transform: perspective(1000px) rotateX(0deg);
    animation: buttonFloat 4s ease-in-out infinite;

    @media (max-width: 768px) {
        padding: 0.8rem 1.5rem;
        font-size: 1rem;
    }

    @media (max-width: 480px) {
        padding: 0.6rem 1.2rem;
        font-size: 0.9rem;
    }

    /* Small height devices */
    @media (max-height: 800px) {
        padding: 0.5rem 1rem;
        font-size: 0.8rem;
    }

    &:hover {
        transform: perspective(1000px) rotateX(5deg) translateY(-3px) scale(1.05);
        box-shadow:
            0 12px 35px rgba(0, 0, 0, 0.4),
            0 6px 12px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        animation-play-state: paused;
    }

    &:active {
        transform: perspective(1000px) rotateX(10deg) translateY(-1px) scale(0.95);
        box-shadow:
            0 6px 20px rgba(0, 0, 0, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }
}

.rule-button {
    background: linear-gradient(135deg, #212f56, #1a2332);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.1);
    animation-delay: 0s;

    &:hover {
        background: linear-gradient(135deg, #2d3f6b, #212f56);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .button-glow {
        background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        animation: buttonGlow 3s ease-in-out infinite;
    }

    .button-text {
        animation: textPulse 2s ease-in-out infinite;
    }
}

.history-button {
    background: linear-gradient(135deg, #212f56, #1a2332);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.1);
    animation-delay: 2s;

    &:hover {
        background: linear-gradient(135deg, #2d3f6b, #212f56);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .button-glow {
        background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        animation: buttonGlow 3s ease-in-out infinite;
        animation-delay: 1.5s;
    }

    .button-text {
        animation: textPulse 2s ease-in-out infinite;
        animation-delay: 1s;
    }
}

.button-text {
    position: relative;
    z-index: 2;
}

.button-glow {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    z-index: 1;
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

@keyframes buttonFloat {
    0%,
    100% {
        transform: perspective(1000px) rotateX(0deg) translateY(0);
    }
    50% {
        transform: perspective(1000px) rotateX(2deg) translateY(-5px);
    }
}

@keyframes textPulse {
    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.8;
        transform: scale(1.02);
    }
}

@keyframes titleButtonFloat {
    0%,
    100% {
        transform: perspective(1000px) rotateX(0deg) translateY(0);
    }
    50% {
        transform: perspective(1000px) rotateX(3deg) translateY(-8px);
    }
}

@keyframes titleButtonGlow {
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

@keyframes titleGlow {
    0% {
        filter: drop-shadow(0 0 10px rgba(96, 165, 250, 0.5));
    }
    100% {
        filter: drop-shadow(0 0 20px rgba(96, 165, 250, 0.8));
    }
}

@keyframes titleBounce {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-10px);
    }
}

@keyframes separatorPulse {
    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.7;
        transform: scale(1.2);
    }
}

@keyframes confettiFloat {
    0%,
    100% {
        transform: translateY(0) rotate(0deg);
        opacity: 0.8;
    }
    25% {
        transform: translateY(-20px) rotate(90deg);
        opacity: 1;
    }
    50% {
        transform: translateY(-10px) rotate(180deg);
        opacity: 0.9;
    }
    75% {
        transform: translateY(-30px) rotate(270deg);
        opacity: 1;
    }
}

@keyframes coinShine {
    0%,
    100% {
        filter: brightness(1);
    }
    50% {
        filter: brightness(1.3);
    }
}

@keyframes coinRotate {
    0% {
        transform: rotateY(0deg);
    }
    100% {
        transform: rotateY(360deg);
    }
}

@keyframes numberPulse {
    0%,
    100% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.1);
        opacity: 0.9;
    }
}

.confirm-button {
    float: right;
}

@mixin afterBg {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    border-radius: 50%;
}

.sidebar-button {
    position: fixed;
    top: calc(50% - 25px);
    right: 1rem;
    transform: translateY(-50%);
    width: 50px;
    height: 50px;
    z-index: 999;

    animation: shockwaveJump 2s ease-out infinite;

    &:after {
        @include afterBg;
        animation: shockwave 2s 0.65s ease-out infinite;
    }

    &:before {
        @include afterBg;
        animation: shockwave 2s 0.5s ease-out infinite;
    }
}

@keyframes shockwaveJump {
    0% {
        transform: scale(1);
    }
    40% {
        transform: scale(1.08);
    }
    50% {
        transform: scale(0.98);
    }
    55% {
        transform: scale(1.02);
    }
    60% {
        transform: scale(0.98);
    }
    100% {
        transform: scale(1);
    }
}

@keyframes shockwave {
    0% {
        transform: scale(1);
        box-shadow:
            0 0 2px rgba(255, 255, 255, 0.15),
            inset 0 0 1px rgba(255, 255, 255, 0.15);
    }
    95% {
        box-shadow:
            0 0 50px rgba(255, 255, 255, 0),
            inset 0 0 30px rgba(255, 255, 255, 0);
    }
    100% {
        transform: scale(2.25);
    }
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    color: white;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
