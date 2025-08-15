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

    <!-- Custom No Coins Popup -->
    <Transition name="popup-fade" appear>
        <div v-if="showNoCoinsPopup" class="no-coins-popup" @click="closeNoCoinsPopup">
            <div class="popup-overlay" @click.stop></div>
            <div class="popup-content" @click.stop>
                <div class="popup-icon">🪙</div>
                <div class="popup-title">No Coins Available</div>
                <div class="popup-message">You don't have enough coins to spin!</div>
                <div class="popup-subtitle">Please get more coins to continue.</div>
                <button class="popup-button" @click="closeNoCoinsPopup">Got it!</button>
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
    coin?: number;
    enable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    products: () => [],
    award: null,
    awardLoading: false,
    coin: 0,
    enable: false
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
    itemLabelFontSizeMax: 20,
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
    rotationSpeedMax: 10000,
    lineWidth: 1,
    lineColor: '#fff'
};

const container = ref();
const isSpinning = ref(false);
const showExplosion = ref(false);
const winningPrize = ref<any>(null);
const showNoCoinsPopup = ref(false);
const usingAwardData = ref(false);

// Sound effects
const spinningSound = ref<HTMLAudioElement | null>(null);
const resultSound = ref<HTMLAudioElement | null>(null);

// Web Audio API for better mobile compatibility
const audioContext = ref<AudioContext | null>(null);
const audioBuffers = ref<AudioBuffer[]>([]);
const audioSources = ref<AudioBufferSourceNode[]>([]);
const gainNodes = ref<GainNode[]>([]);
const currentSourceIndex = ref(0);
const isAudioInitialized = ref(false);

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

const closeNoCoinsPopup = () => {
    showNoCoinsPopup.value = false;
};

const spin = async () => {
    if (!wheel || props.awardLoading) return;

    // Check if user has coins to spin
    if (props.coin <= 0 || !props.enable) {
        showNoCoinsPopup.value = true;
        return;
    }

    // Reset award data flag
    usingAwardData.value = false;

    // Request award from API
    emit('request-award');

    // Start spinning immediately to show user feedback
    spinRandom();
};

const spinToIndex = (targetIndex: number) => {
    if (!wheel) return;

    if (spinningSound.value) {
        spinningSound.value.currentTime = 0;
        const playPromise = spinningSound.value.play();
        if (playPromise !== undefined) {
            playPromise.catch((e) => {
                console.log('Could not play spinning sound:', e);
                // Retry for mobile devices
                setTimeout(() => {
                    spinningSound.value?.play().catch((e2) => console.log('Retry failed:', e2));
                }, 100);
            });
        }
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

        // Enhanced sound synchronization for better speed consistency
        if (spinningSound.value) {
            const speed = Math.min(wheel.rotationSpeed, 10000);

            // Much more responsive playback rate for fast wheel speeds
            let playbackRate;
            if (speed > 7000) {
                playbackRate = 6.0 + (speed - 7000) / 500; // 6.0x to 12.0x for very high speeds
            } else if (speed > 4000) {
                playbackRate = 3.0 + (speed - 4000) / 750; // 3.0x to 7.0x for high speeds
            } else if (speed > 2000) {
                playbackRate = 1.5 + (speed - 2000) / 1000; // 1.5x to 3.5x for medium speeds
            } else {
                playbackRate = 0.8 + speed / 2500; // 0.8x to 1.6x for low speeds
            }

            playbackRate = Math.max(0.8, Math.min(12.0, playbackRate));

            // Volume that increases with speed for more dramatic effect
            const volume = Math.max(0.5, Math.min(1.0, 0.5 + (speed / 10000) * 0.5));

            spinningSound.value.playbackRate = playbackRate;
            spinningSound.value.volume = volume;
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

    // Stop any existing Web Audio sources
    audioSources.value.forEach((source) => {
        try {
            source.stop();
        } catch (e) {
            // Ignore errors if already stopped
        }
    });
    audioSources.value = [];
    gainNodes.value = [];

    // Start with the slowest sound using Web Audio API
    currentSourceIndex.value = 0;
    if (isAudioInitialized.value && audioContext.value && audioBuffers.value.length > 0) {
        const startSource = audioContext.value.createBufferSource();
        const startGain = audioContext.value.createGain();

        startSource.buffer = audioBuffers.value[0];
        startSource.loop = true;
        startSource.connect(startGain);
        startGain.connect(audioContext.value.destination);
        startGain.gain.value = 0.7;

        startSource.start();
        audioSources.value.push(startSource);
        gainNodes.value.push(startGain);
    } else {
        // Fallback to HTML5 Audio
        if (spinningSound.value) {
            spinningSound.value.currentTime = 0;
            spinningSound.value
                .play()
                .catch((e) => console.log('Could not play spinning sound:', e));
        }
    }

    let segmentCount = 0;
    let lastSegmentTime = performance.now();
    let segmentInterval = 100;
    let animationId: number | null = null;

    const updateSoundBasedOnSegments = () => {
        if (!wheel || !isSpinning.value) {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            // Stop all Web Audio sources when spinning ends
            audioSources.value.forEach((source) => {
                try {
                    source.stop();
                } catch (e) {
                    // Ignore errors if already stopped
                }
            });
            audioSources.value = [];
            gainNodes.value = [];

            // Also stop HTML5 Audio fallback
            if (spinningSound.value) {
                spinningSound.value.pause();
                spinningSound.value.currentTime = 0;
            }
            return;
        }

        const currentTime = performance.now();
        const timeSinceLastSegment = currentTime - lastSegmentTime;

        if (segmentInterval > 0) {
            const speedFactor = 1000 / segmentInterval;

            // Determine which sound to play based on speed
            let newSoundIndex = 0;
            if (speedFactor > 25) newSoundIndex = 4; // Ultra fast
            else if (speedFactor > 20) newSoundIndex = 3; // Very fast
            else if (speedFactor > 15) newSoundIndex = 2; // Fast
            else if (speedFactor > 10) newSoundIndex = 1; // Medium
            else newSoundIndex = 0; // Slow

            // Switch to new sound if needed
            if (
                newSoundIndex !== currentSourceIndex.value &&
                isAudioInitialized.value &&
                audioContext.value
            ) {
                // Stop current source
                if (audioSources.value[currentSourceIndex.value]) {
                    try {
                        audioSources.value[currentSourceIndex.value].stop();
                    } catch (e) {
                        // Ignore errors if already stopped
                    }
                }

                // Start new source
                const newSource = audioContext.value.createBufferSource();
                const newGain = audioContext.value.createGain();

                newSource.buffer = audioBuffers.value[newSoundIndex];
                newSource.loop = true;
                newSource.connect(newGain);
                newGain.connect(audioContext.value.destination);
                newGain.gain.value = 0.7;

                newSource.start();

                // Replace the current source
                audioSources.value[currentSourceIndex.value] = newSource;
                gainNodes.value[currentSourceIndex.value] = newGain;
                currentSourceIndex.value = newSoundIndex;
            }
        }

        if (isSpinning.value) {
            animationId = requestAnimationFrame(updateSoundBasedOnSegments);
        }
    };

    wheel.onCurrentIndexChange = () => {
        if (!wheel) return;

        const currentTime = performance.now();
        segmentInterval = currentTime - lastSegmentTime;
        lastSegmentTime = currentTime;
        segmentCount++;

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
    };

    wheel.onSpin = () => {
        isSpinning.value = true;
        lastSegmentTime = performance.now();
        segmentInterval = 100;
        updateSoundBasedOnSegments();
    };

    wheel.rotationResistance = -800;
    wheel.spin(8000 + random.int(2000, 4000));
};

let currentItems: any[] = [];
let originalProducts: Product[] = [];

const initializeWheel = (items: any[]) => {
    if (!container.value) return;

    currentItems = items;
    originalProducts = props.products || [];

    const processedItems = items.map((item) => {
        const processedItem: any = {
            ...item,
            image: null,
            imageOpacity: 1,
            imageRadius: 0.75,
            imageRotation: 0,
            imageScale: 0.03
        };

        if (item.showLabel === false) {
            processedItem.label = '';
        } else {
            const englishLabel = item.label;
            const chineseLabel = item.chineseLabel;
            const maxLength = 7;
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

    if (wheel) {
        if (container.value) {
            const backgroundElements = container.value.querySelectorAll('picture, .image, .icon');
            container.value.innerHTML = '';
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

        if (spinningSound.value) {
            spinningSound.value.pause();
            spinningSound.value.currentTime = 0;
        }

        if (resultSound.value) {
            resultSound.value.currentTime = 0;
            const playPromise = resultSound.value.play();
            if (playPromise !== undefined) {
                playPromise.catch((e) => {
                    console.log('Could not play result sound:', e);
                    // Retry for mobile devices
                    setTimeout(() => {
                        resultSound.value?.play().catch((e2) => console.log('Retry failed:', e2));
                    }, 100);
                });
            }
        }

        const winningIndex = $event.currentIndex;

        if (props.award && usingAwardData.value) {
            winningPrize.value = {
                label: props.award.productEnName,
                chineseLabel: props.award.productZhName,
                image: props.award.imgUrl,
                productId: props.award.id.toString()
            };
            console.log('Using award data for winning prize:', winningPrize.value);
        } else {
            winningPrize.value = currentItems[winningIndex];
            console.log('Using wheel index for winning prize:', winningPrize.value);
        }

        console.log('Winning prize:', winningPrize.value);
        console.log('Winning index:', winningIndex);

        showExplosion.value = true;
        console.log('Explosion should be visible:', showExplosion.value);
    };

    wheel.onSpin = () => {
        console.log('Spin started');
        isSpinning.value = true;

        if (spinningSound.value && spinningSound.value.paused) {
            spinningSound.value
                .play()
                .catch((e) => console.log('Could not play spinning sound:', e));
        }
    };

    setTimeout(() => {
        if (wheel) {
            wheel.itemLabelRadiusMax = 0.3;
        }
    }, 50);
};

onMounted(() => {
    // Detect mobile device
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        navigator.userAgent.toLowerCase()
    );
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());

    // Initialize sound effects with mobile optimizations
    spinningSound.value = new Audio('/sound/start-13691.mp3');
    spinningSound.value.loop = true;
    spinningSound.value.volume = isMobile ? 0.8 : 0.9;
    spinningSound.value.preload = 'auto';

    resultSound.value = new Audio('/sound/tada-fanfare-a-6313.mp3');
    resultSound.value.volume = isMobile ? 0.8 : 0.9;
    resultSound.value.preload = 'auto';

    // Initialize Web Audio API for better mobile compatibility
    const initWebAudio = async () => {
        try {
            // Create audio context
            audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)();

            // Load audio buffer
            const response = await fetch('/sound/start-13691.mp3');
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.value.decodeAudioData(arrayBuffer);

            // Create multiple buffers with different playback rates
            const playbackRates = [0.8, 1.5, 2.5, 3.5, 4.0];
            audioBuffers.value = playbackRates.map((rate) => {
                // Create a new buffer with modified playback rate
                const newBuffer = audioContext.value!.createBuffer(
                    audioBuffer.numberOfChannels,
                    Math.floor(audioBuffer.length / rate),
                    audioBuffer.sampleRate
                );

                // Copy and stretch the audio data
                for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                    const originalData = audioBuffer.getChannelData(channel);
                    const newData = newBuffer.getChannelData(channel);

                    for (let i = 0; i < newData.length; i++) {
                        const originalIndex = Math.floor(i * rate);
                        if (originalIndex < originalData.length) {
                            newData[i] = originalData[originalIndex];
                        }
                    }
                }

                return newBuffer;
            });

            isAudioInitialized.value = true;
            console.log('Web Audio API initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Web Audio API:', error);
            // Fallback to HTML5 Audio
            isAudioInitialized.value = false;
        }
    };

    // Initialize Web Audio API
    initWebAudio();

    // Initialize wheel with current products or mock data
    const items = convertProductsToWheelItems(props.products);
    initializeWheel(items);

    // Mobile audio unlock function with iOS-specific handling
    const unlockMobileAudio = () => {
        // For iOS, we need to be more aggressive with audio unlocking
        if (isIOS) {
            // Create a silent audio context to unlock audio
            try {
                const audioContext = new (window.AudioContext ||
                    (window as any).webkitAudioContext)();
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }

                // Create a silent buffer to unlock audio
                const buffer = audioContext.createBuffer(1, 1, 22050);
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start();
            } catch (error) {
                console.log('Audio context unlock failed:', error);
            }
        }

        // Try to play and immediately pause to unlock audio
        if (spinningSound.value) {
            const playPromise = spinningSound.value.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        spinningSound.value?.pause();
                        spinningSound.value!.currentTime = 0;
                    })
                    .catch(() => {
                        // Ignore errors, just trying to unlock audio
                    });
            }
        }

        // Unlock Web Audio API
        if (audioContext.value && audioContext.value.state === 'suspended') {
            audioContext.value.resume();
        }

        if (resultSound.value) {
            const playPromise = resultSound.value.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        resultSound.value?.pause();
                        resultSound.value!.currentTime = 0;
                    })
                    .catch(() => {
                        // Ignore errors, just trying to unlock audio
                    });
            }
        }

        // Remove event listeners after first interaction
        document.removeEventListener('touchstart', unlockMobileAudio);
        document.removeEventListener('click', unlockMobileAudio);
        document.removeEventListener('keydown', unlockMobileAudio);
    };

    // Add event listeners for mobile audio unlock
    document.addEventListener('touchstart', unlockMobileAudio);
    document.addEventListener('click', unlockMobileAudio);
    document.addEventListener('keydown', unlockMobileAudio);
});

watch(
    () => props.products,
    (newProducts) => {
        if (newProducts && newProducts.length > 0) {
            console.log('Products updated, reinitializing wheel:', newProducts);
            originalProducts = newProducts;
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
            console.log('=== AWARD RECEIVED ===');
            console.log('Award data:', newAward);
            console.log('API Product Name:', newAward.productEnName);
            console.log('API Chinese Name:', newAward.productZhName);
            console.log('Current wheel items:', currentItems);
            console.log('Original products:', originalProducts);

            let winningIndex = -1;
            let matchedProduct = null;

            if (originalProducts.length > 0) {
                const originalIndex = originalProducts.findIndex((product) => {
                    console.log(`Comparing: "${product.enName}" with "${newAward.productEnName}"`);
                    console.log(`Chinese: "${product.zhName}" with "${newAward.productZhName}"`);

                    // Exact match
                    if (
                        product.enName === newAward.productEnName ||
                        product.zhName === newAward.productZhName
                    ) {
                        console.log('✅ Exact match found!');
                        return true;
                    }

                    // Case-insensitive match
                    if (
                        product.enName.toLowerCase() === newAward.productEnName.toLowerCase() ||
                        product.zhName.toLowerCase() === newAward.productZhName.toLowerCase()
                    ) {
                        console.log('✅ Case-insensitive match found!');
                        return true;
                    }

                    // Contains match
                    if (
                        product.enName
                            .toLowerCase()
                            .includes(newAward.productEnName.toLowerCase()) ||
                        newAward.productEnName.toLowerCase().includes(product.enName.toLowerCase())
                    ) {
                        console.log('✅ Contains match found!');
                        return true;
                    }

                    return false;
                });

                if (originalIndex !== -1) {
                    winningIndex = originalIndex;
                    matchedProduct = originalProducts[originalIndex];
                    console.log('✅ Found match in original products at index:', winningIndex);
                }
            }

            // Method 2: Fallback to wheel items matching
            if (winningIndex === -1) {
                console.log('Trying fallback matching with wheel items...');
                winningIndex = currentItems.findIndex((item, index) => {
                    const originalLabel = item.label.replace(/\.\.\.$/, '');
                    const apiProductName = newAward.productEnName;

                    console.log(
                        `Wheel item ${index}: "${originalLabel}" vs API: "${apiProductName}"`
                    );

                    // Exact match
                    if (
                        originalLabel === apiProductName ||
                        item.chineseLabel === newAward.productZhName
                    ) {
                        console.log('✅ Wheel item exact match found!');
                        return true;
                    }

                    // Case-insensitive match
                    if (
                        originalLabel.toLowerCase() === apiProductName.toLowerCase() ||
                        item.chineseLabel.toLowerCase() === newAward.productZhName.toLowerCase()
                    ) {
                        console.log('✅ Wheel item case-insensitive match found!');
                        return true;
                    }

                    // Contains match
                    if (
                        originalLabel.toLowerCase().includes(apiProductName.toLowerCase()) ||
                        apiProductName.toLowerCase().includes(originalLabel.toLowerCase())
                    ) {
                        console.log('✅ Wheel item contains match found!');
                        return true;
                    }

                    // Partial match (first few characters)
                    const minLength = Math.min(originalLabel.length, apiProductName.length);
                    if (minLength >= 3) {
                        const wheelStart = originalLabel.toLowerCase().substring(0, minLength);
                        const apiStart = apiProductName.toLowerCase().substring(0, minLength);
                        if (wheelStart === apiStart) {
                            console.log('✅ Wheel item partial match found!');
                            return true;
                        }
                    }

                    return false;
                });
            }

            console.log('=== MATCHING RESULT ===');
            console.log('Winning index:', winningIndex);
            console.log('Matched product:', matchedProduct);

            if (winningIndex !== -1) {
                // Set flag to use award data
                usingAwardData.value = true;

                // Calculate target angle
                const targetAngle = (360 / currentItems.length) * winningIndex;
                console.log('Target angle for index', winningIndex, ':', targetAngle);

                if (isSpinning.value) {
                    // Get current wheel rotation
                    const currentRotation = wheel.rotation;
                    const currentAngle = currentRotation % 360;

                    // Calculate the shortest path to the target
                    let angleToAdd = targetAngle - currentAngle;

                    // Normalize to ensure we spin in the positive direction
                    while (angleToAdd <= 0) {
                        angleToAdd += 360;
                    }

                    // Add extra rotations for dramatic effect (but not too many)
                    const extraRotations = 360 * 1; // Reduced from 2 to 1 full rotation
                    const finalAngleToSpin = extraRotations + angleToAdd;

                    console.log('Current rotation:', currentRotation);
                    console.log('Current angle:', currentAngle);
                    console.log('Target angle:', targetAngle);
                    console.log('Angle to add:', angleToAdd);
                    console.log('Extra rotations:', extraRotations);
                    console.log('Final angle to spin:', finalAngleToSpin);

                    // Continue spinning to the correct position
                    // Use spinToItem for precise positioning with gradual slowdown
                    wheel.spinToItem(winningIndex, 5000, false, 8, 1);
                } else {
                    // If wheel is not spinning, start spinning to the target
                    console.log('Starting spin to target index:', winningIndex);
                    wheel.spinToItem(winningIndex, 5000, false, 10, 1);
                }
            } else {
                console.error('❌ Could not find matching product for award:', newAward);
                console.log(
                    'Available original products:',
                    originalProducts.map((p) => ({
                        enName: p.enName,
                        zhName: p.zhName
                    }))
                );
                console.log(
                    'Available wheel items:',
                    currentItems.map((item) => ({
                        label: item.label,
                        chineseLabel: item.chineseLabel,
                        originalLabel: item.label.replace(/\.\.\.$/, '')
                    }))
                );
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

/* Custom No Coins Popup Styles */
.no-coins-popup {
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

.popup-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    animation: popupFadeIn 0.3s ease-out;
}

.popup-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    padding: 2rem;
    text-align: center;
    box-shadow:
        0 20px 40px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.1);
    max-width: 400px;
    width: 90%;
    animation: popupSlideIn 0.4s ease-out;
}

.popup-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: coinBounce 0.6s ease-out 0.2s both;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.popup-title {
    font-size: 1.8rem;
    font-weight: bold;
    color: white;
    margin-bottom: 0.5rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    animation: textSlideIn 0.5s ease-out 0.3s both;
}

.popup-message {
    font-size: 1.2rem;
    color: #f8f9fa;
    margin-bottom: 0.5rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    animation: textSlideIn 0.5s ease-out 0.4s both;
}

.popup-subtitle {
    font-size: 1rem;
    color: #e9ecef;
    margin-bottom: 1.5rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    animation: textSlideIn 0.5s ease-out 0.5s both;
}

.popup-button {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
    color: white;
    border: none;
    border-radius: 50px;
    padding: 0.8rem 2rem;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(238, 90, 36, 0.4);
    animation: buttonSlideIn 0.5s ease-out 0.6s both;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(238, 90, 36, 0.6);
        background: linear-gradient(135deg, #ff5252 0%, #d63031 100%);
    }

    &:active {
        transform: translateY(0);
        box-shadow: 0 2px 10px rgba(238, 90, 36, 0.4);
    }
}

/* Popup Animation Keyframes */
@keyframes popupFadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes popupSlideIn {
    0% {
        opacity: 0;
        transform: translate(-50%, -60%) scale(0.8);
    }
    50% {
        transform: translate(-50%, -45%) scale(1.05);
    }
    100% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
}

@keyframes coinBounce {
    0% {
        opacity: 0;
        transform: scale(0) rotate(-180deg);
    }
    50% {
        transform: scale(1.2) rotate(-90deg);
    }
    100% {
        opacity: 1;
        transform: scale(1) rotate(0deg);
    }
}

@keyframes textSlideIn {
    0% {
        opacity: 0;
        transform: translateY(20px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes buttonSlideIn {
    0% {
        opacity: 0;
        transform: translateY(30px) scale(0.9);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* Popup Transition Animations */
.popup-fade-enter-active {
    transition: all 0.3s ease-out;
}

.popup-fade-leave-active {
    transition: all 0.2s ease-in;
}

.popup-fade-enter-from {
    opacity: 0;
}

.popup-fade-leave-to {
    opacity: 0;
}
</style>
