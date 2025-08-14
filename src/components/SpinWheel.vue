<template>
    <div ref="container" class="flex spin-container">
        <picture>
            <source srcset="/img/image.avif" type="image/avif" />
            <source srcset="/img/image.webp" type="image/webp" />
            <img src="/img/image.png" class="image" alt="background image" />
        </picture>
        <div
            class="icon"
            :class="{ spinning: isSpinning }"
            @click="!isSpinning && spin()"
            @keyup.enter="!isSpinning && spin()"
            @keyup.space="!isSpinning && spin()"
            v-tooltip.bottom="{
                value: isSpinning ? 'Spinning...' : '↻ Spin!',
                class: 'text-xl',
                escape: true
            }"
            tabindex="0"
        ></div>
    </div>

    <!-- Explosion Animation - Moved outside spin-container -->
    <Transition name="explosion-fade" appear>
        <div v-if="showExplosion" class="explosion-container" @click="closeExplosion">
            <div class="explosion-overlay" @click.stop></div>
            <div class="explosion-content" @click.stop>
                <div class="explosion-box">
                    <div class="explosion-particles">
                        <div
                            v-for="i in 20"
                            :key="i"
                            class="particle"
                            :style="getParticleStyle(i)"
                        ></div>
                    </div>
                    <div class="prize-reveal">
                        <button class="close-button" @click="closeExplosion">×</button>
                        <div class="prize-image">
                            <img :src="winningPrize?.image" :alt="winningPrize?.label" />
                        </div>
                        <div class="prize-name">{{ winningPrize?.label }}</div>
                        <div class="prize-chinese-name">{{ winningPrize?.chineseLabel }}</div>
                        <div class="congratulations-text">Congratulations!</div>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, inject } from 'vue';
import random from 'random';
import { Wheel, type WheelProps } from 'spin-wheel';
import type { Product } from '@/services/ProductService';

interface Props {
    products?: Product[];
    award?: any;
    awardLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    products: () => [],
    award: null,
    awardLoading: false
});

const emit = defineEmits<{
    'request-award': [];
    'clear-award': [];
}>();

const properties: WheelProps = {
    isInteractive: false,
    radius: 0.48,
    rotationResistance: 0,
    itemLabelRadius: 0.5,
    itemLabelRadiusMax: 0.3,
    itemLabelRotation: 90,
    itemLabelAlign: 'center',
    itemLabelColors: ['#FFFFFF'],
    itemLabelBaselineOffset: -0.15,
    itemLabelFont:
        '"Suez One", "Mochiy Pop P One", "Jua", "Unbounded", "Mitr", "Noto Sans TC", "Noto Sans SC", "Noto Sans Lao", "Noto Color Emoji"',
    itemLabelFontSizeMax: 16,
    itemBackgroundColors: [
        '#00A050',
        '#EE312A',
        '#FFB100',
        '#007AFF',
        '#EB6F0C',
        '#DB4397',
        '#A63DDC',
        '#077CBD'
    ],
    rotationSpeedMax: 2000,
    lineWidth: 1,
    lineColor: '#fff'
};

const container = ref();
const isSpinning = ref(false);
const showExplosion = ref(false);
const winningPrize = ref<any>(null);

// Sound effects
const spinningSound = ref<HTMLAudioElement | null>(null);
const resultSound = ref<HTMLAudioElement | null>(null);

let spinCount = 0;
let wheel: Wheel | undefined = undefined;

const convertProductsToWheelItems = (products: Product[]) => {
    return products.map((product) => ({
        label: product.enName,
        chineseLabel: product.zhName,
        weight: 2,
        image: product.productUrl,
        showLabel: true,
        productId: product.id.toString()
    }));
};

const getParticleStyle = (index: number) => {
    const angle = (index / 20) * 360;
    const distance = 120 + Math.random() * 80;
    const x = Math.cos((angle * Math.PI) / 180) * distance;
    const y = Math.sin((angle * Math.PI) / 180) * distance;
    const delay = Math.random() * 0.8;
    const color = [
        '#FFD700',
        '#FF6B6B',
        '#4ECDC4',
        '#45B7D1',
        '#96CEB4',
        '#FFEAA7',
        '#FF8C42',
        '#9B59B6'
    ][Math.floor(Math.random() * 8)];

    return {
        '--angle': `${angle}deg`,
        '--distance': `${distance}px`,
        '--x': `${x}px`,
        '--y': `${y}px`,
        '--delay': `${delay}s`,
        '--color': color
    };
};

const closeExplosion = () => {
    showExplosion.value = false;
    // Clear award and refresh coin
    emit('clear-award');
};

const spin = async () => {
    if (!wheel || props.awardLoading) return;

    // Start spinning immediately
    spinRandom();

    // Request award from API
    emit('request-award');
};

const spinToIndex = (targetIndex: number) => {
    if (!wheel) return;

    if (spinningSound.value) {
        spinningSound.value.currentTime = 0;
        spinningSound.value.play().catch((e) => console.log('Could not play spinning sound:', e));
    }

    wheel.onCurrentIndexChange = () => {
        if (!wheel) return;

        switch (true) {
            case wheel.rotationSpeed < 400:
                wheel.rotationResistance = -100;
                break;
            case wheel.rotationSpeed < 100:
                wheel.rotationResistance = -30;
                break;
            case wheel.rotationSpeed < 30:
                wheel.rotationResistance = -10;
                break;
        }

        // Synchronize spinning sound with wheel speed
        if (spinningSound.value) {
            const minSpeed = 0;
            const maxSpeed = 1000;
            const minRate = 0.5;
            const maxRate = 8.0;

            const speedRatio = Math.max(
                0,
                Math.min(1, (wheel.rotationSpeed - minSpeed) / (maxSpeed - minSpeed))
            );
            const playbackRate = minRate + speedRatio * (maxRate - minRate);

            spinningSound.value.playbackRate = playbackRate;

            const volumeRatio = Math.max(
                0,
                Math.min(1, (wheel.rotationSpeed - minSpeed) / (maxSpeed - minSpeed))
            );
            spinningSound.value.volume = Math.min(1.0, 0.4 + volumeRatio * 0.6);
        }
    };

    wheel.rotationResistance = -300;
    // Spin to target index with some randomness
    const spinDistance = random.int(3, 5); // Spin 3-5 full rotations
    const targetAngle = (360 / currentItems.length) * targetIndex;
    const totalAngle = 360 * spinDistance + targetAngle;
    wheel.spin(totalAngle);
};

const spinRandom = () => {
    if (!wheel) return;

    if (spinningSound.value) {
        spinningSound.value.currentTime = 0;
        spinningSound.value.play().catch((e) => console.log('Could not play spinning sound:', e));
    }

    wheel.onCurrentIndexChange = () => {
        if (!wheel) return;

        switch (true) {
            case wheel.rotationSpeed < 400:
                wheel.rotationResistance = -100;
                break;
            case wheel.rotationSpeed < 100:
                wheel.rotationResistance = -30;
                break;
            case wheel.rotationSpeed < 30:
                wheel.rotationResistance = -10;
                break;
        }

        if (spinningSound.value) {
            const minSpeed = 0;
            const maxSpeed = 1000;
            const minRate = 0.5;
            const maxRate = 8.0;

            const speedRatio = Math.max(
                0,
                Math.min(1, (wheel.rotationSpeed - minSpeed) / (maxSpeed - minSpeed))
            );
            const playbackRate = minRate + speedRatio * (maxRate - minRate);

            spinningSound.value.playbackRate = playbackRate;

            const volumeRatio = Math.max(
                0,
                Math.min(1, (wheel.rotationSpeed - minSpeed) / (maxSpeed - minSpeed))
            );
            spinningSound.value.volume = Math.min(1.0, 0.4 + volumeRatio * 0.6);
        }
    };

    wheel.rotationResistance = -300;
    wheel.spin(wheel.rotationSpeed + random.int(1200, 1800));
};

// Store current items for winning prize lookup
let currentItems: any[] = [];

// Initialize wheel with items
const initializeWheel = (items: any[]) => {
    if (!container.value) return;

    // Store the current items for winning prize lookup
    currentItems = items;

    // Process items for the wheel
    const processedItems = items.map((item) => {
        const processedItem: any = {
            ...item,
            image: null,
            imageOpacity: 1,
            imageRadius: 0.75,
            imageRotation: 0,
            imageScale: 0.03
        };

        // Control label visibility and display only English labels
        if (item.showLabel === false) {
            processedItem.label = '';
        } else {
            // Display only English labels with ellipsis if too long
            const englishLabel = item.label;
            const chineseLabel = item.chineseLabel;
            const maxLength = 10;
            processedItem.label =
                englishLabel.length > maxLength
                    ? englishLabel.substring(0, maxLength) + '...'
                    : englishLabel;
        }

        if (item.image) {
            const img = new Image();
            img.src = item.image;
            processedItem.image = img;
        }

        return processedItem;
    });

    console.log({ processedItems });

    // Recreate wheel if it exists
    if (wheel) {
        // Clear only the wheel elements, preserve background and spin button
        if (container.value) {
            const backgroundElements = container.value.querySelectorAll('picture, .image, .icon');
            container.value.innerHTML = '';
            // Restore background elements and spin button
            backgroundElements.forEach((element: Element) => {
                container.value.appendChild(element);
            });
        }
    }

    wheel = new Wheel(container.value, {
        ...properties,
        items: processedItems
    });

    wheel.spin(10);

    wheel.onRest = ($event) => {
        console.log('Spin ended on:', $event);
        isSpinning.value = false;

        // Stop spinning sound
        if (spinningSound.value) {
            spinningSound.value.pause();
            spinningSound.value.currentTime = 0;
        }

        // Play result sound
        if (resultSound.value) {
            resultSound.value.currentTime = 0;
            resultSound.value.play().catch((e) => console.log('Could not play result sound:', e));
        }

        // Get the winning prize from award API or current items
        const winningIndex = $event.currentIndex;

        if (props.award) {
            // Use award data from API
            winningPrize.value = {
                label: props.award.productEnName,
                chineseLabel: props.award.productZhName,
                image: props.award.imgUrl,
                productId: props.award.id.toString()
            };
        } else {
            // Fallback to current items
            winningPrize.value = currentItems[winningIndex];
        }

        console.log('Winning prize:', winningPrize.value);
        console.log('Winning index:', winningIndex);

        // Show explosion animation
        showExplosion.value = true;
        console.log('Explosion should be visible:', showExplosion.value);
    };

    wheel.onSpin = () => {
        console.log('Spin started');
        isSpinning.value = true;

        // Ensure spinning sound is playing
        if (spinningSound.value && spinningSound.value.paused) {
            spinningSound.value
                .play()
                .catch((e) => console.log('Could not play spinning sound:', e));
        }
    };

    // Workaround for itemLabelRadiusMax not working on first load.
    setTimeout(() => {
        if (wheel) {
            wheel.itemLabelRadiusMax = 0.3;
        }
    }, 50);
};

onMounted(() => {
    // Initialize sound effects
    spinningSound.value = new Audio('/sound/start-13691.mp3');
    spinningSound.value.loop = true;
    spinningSound.value.volume = 0.9;

    resultSound.value = new Audio('/sound/tada-fanfare-a-6313.mp3');
    resultSound.value.volume = 0.9;

    // Initialize wheel with current products or mock data
    const items = convertProductsToWheelItems(props.products);
    initializeWheel(items);
});

// Watch for changes in products
watch(
    () => props.products,
    (newProducts) => {
        if (newProducts && newProducts.length > 0) {
            console.log('Products updated, reinitializing wheel:', newProducts);
            const items = convertProductsToWheelItems(newProducts);
            initializeWheel(items);
        }
    },
    { deep: true }
);

// Watch for award response
watch(
    () => props.award,
    (newAward) => {
        if (newAward && currentItems.length > 0 && wheel) {
            // Find the index of the winning product
            const winningIndex = currentItems.findIndex(
                (item) =>
                    item.label === newAward.productEnName ||
                    item.chineseLabel === newAward.productZhName
            );

            if (winningIndex !== -1) {
                // Adjust wheel to land on the winning product
                const targetAngle = (360 / currentItems.length) * winningIndex;

                // Add some extra rotations to make it look natural
                const extraRotations = 360 * 2; // 2 full rotations
                const finalAngle = extraRotations + targetAngle;

                // Smoothly adjust to the target position
                wheel.spin(finalAngle);
            }
        }
    }
);
</script>

<style lang="scss" scoped>
@import 'primeflex/core/_variables.scss';

.spin-container {
    aspect-ratio: 1/1;
    width: 200vw;
    height: 90vh;

    position: absolute;
    bottom: -10vh;
    left: 50%;
    transform: translateX(-50%);

    /* Mobile devices */
    @media (max-width: 767px) {
        height: 85vh;
        bottom: -10vh;
    }

    /* Small tablets */
    @media (min-width: map-get($breakpoints, 'sm')) {
        height: 100vh;
    }

    /* Tablets (iPad all series) - smaller size */
    @media (min-width: map-get($breakpoints, 'md')) {
        height: 80vh;
        width: 150vw;
    }

    /* Large tablets */
    @media (min-width: 1024px) {
        height: 85vh;
        width: 160vw;
    }
}

.image {
    object-position: center;
    object-fit: contain;

    aspect-ratio: 1/1;
    width: 200vw;
    height: 90vh;

    position: absolute;
    bottom: 0vh;
    left: 50%;
    transform: translateX(-50%);

    /* Mobile devices */
    @media (max-width: 767px) {
        height: 85vh;
        bottom: 0vh;
    }

    /* Small tablets */
    @media (min-width: map-get($breakpoints, 'sm')) {
        height: 100vh;
    }

    /* Tablets (iPad all series) - smaller size */
    @media (min-width: 767px) {
        height: 80vh;
        width: 150vw;
    }

    /* Large tablets */
    @media (min-width: 1024px) {
        height: 85vh;
        width: 160vw;
    }
}

.button-container {
    margin-top: -5.5rem;

    button {
        z-index: 2;
        position: relative;

        $background-color: #0c0f1d;
        background: $background-color;

        &:hover {
            filter: brightness(1.3);
        }
    }
}

.icon {
    $icon-size: 10vh;
    cursor: pointer;

    width: $icon-size;
    height: $icon-size;
    border-radius: 50%;

    background-image: url(/img/spin.png);
    background-image: -webkit-image-set(url(/img/spin.png) type('image/png'));
    background-image: image-set(url(/img/spin.png) type('image/png'));

    background-size: contain;

    position: absolute;
    top: calc(calc(50%) - calc($icon-size / 2));
    left: calc(calc(50%) - calc($icon-size / 2));

    transition: background-image 0.3s ease;

    &:hover {
        filter: brightness(1.1);
    }

    &.spinning {
        background-image: url(/img/MPOS.png);
        background-image: -webkit-image-set(url(/img/MPOS.png) type('image/png'));
        background-image: image-set(url(/img/MPOS.png) type('image/png'));
    }

    &.disabled {
        cursor: not-allowed;
        opacity: 0.6;
        pointer-events: none;
    }
}

/* Explosion Animation Styles */
.explosion-container {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    z-index: 99999 !important;
    pointer-events: auto;
    overflow: visible;
    background: transparent;
}

.explosion-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    animation: fadeIn 0.8s ease-out;
}

.explosion-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
}

.explosion-box {
    position: relative;
    width: 300px;
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: explosionScale 1.2s ease-out;
}

.explosion-particles {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
}

.particle {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 8px;
    height: 8px;
    background: var(--color, #ffd700);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: particleExplode 1.8s ease-out var(--delay, 0s) forwards;
}

.prize-reveal {
    position: relative;
    z-index: 10;
    text-align: center;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(76, 175, 80, 0.8) 100%);
    padding: 2rem;
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    animation: prizeReveal 1.2s ease-out 0.6s both;
    min-width: 250px;
    max-width: 500px;
    width: 90%;
    margin: 0 auto;
}

.close-button {
    position: absolute;
    top: 10px;
    right: 15px;
    background: rgba(231, 76, 60, 0.8);
    border: none;
    color: white;
    font-size: 24px;
    font-weight: bold;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    z-index: 20;
}

.close-button:hover {
    background: rgba(231, 76, 60, 1);
    transform: scale(1.1);
}

.prize-image {
    margin-bottom: 1rem;

    img {
        width: 120px;
        height: 120px;
        object-fit: contain;
        border-radius: 15px;
        background: white;
        padding: 0.8rem;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }
}

.prize-name {
    font-size: 1.5rem;
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 0.5rem;
    text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
}

.prize-chinese-name {
    font-size: 1rem;
    color: #34495e;
    margin-bottom: 1rem;
    text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
}

.congratulations-text {
    font-size: 1.2rem;
    font-weight: bold;
    color: #e74c3c;
    text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
    animation: congratulationsPulse 1s ease-in-out infinite;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes explosionScale {
    0% {
        transform: scale(0);
    }
    50% {
        transform: scale(1.2);
    }
    100% {
        transform: scale(1);
    }
}

@keyframes particleExplode {
    0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 1;
    }
    50% {
        transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1);
        opacity: 1;
    }
    100% {
        transform: translate(calc(-50% + var(--x) * 1.5), calc(-50% + var(--y) * 1.5)) scale(0);
        opacity: 0;
    }
}

@keyframes prizeReveal {
    0% {
        transform: scale(0) rotate(-180deg);
        opacity: 0;
    }
    50% {
        transform: scale(1.1) rotate(-90deg);
        opacity: 0.8;
    }
    100% {
        transform: scale(1) rotate(0deg);
        opacity: 1;
    }
}

@keyframes congratulationsPulse {
    0%,
    100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
}

/* Vue Transition Animations */
.explosion-fade-enter-active {
    transition: all 0.8s ease-out;
}

.explosion-fade-leave-active {
    transition: all 0.6s ease-in;
}

.explosion-fade-enter-from {
    opacity: 0;
    transform: scale(0.8);
}

.explosion-fade-leave-to {
    opacity: 0;
    transform: scale(1.1);
}
</style>
