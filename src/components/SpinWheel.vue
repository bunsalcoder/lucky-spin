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
      @click="spin"
      @keyup.enter="spin"
      @keyup.space="spin"
      v-tooltip.bottom="{
        value: `↻ Spin!`,
        class: 'text-xl',
        escape: true
      }"
      tabindex="0"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import random from 'random';
import { Wheel, type WheelProps } from 'spin-wheel';

// Mock data directly in component
const mockItems = [
  {
    label: 'Redmi Pad SE',
    chineseLabel: 'Redme Pad SE',
    weight: 2,
    image: '/img/tablet.png',
    showLabel: true
  },
  {
    label: 'iPhone',
    chineseLabel: '苹果手机',
    weight: 2,
    image: '/img/iphone.png',
    showLabel: true
  },
  {
    label: 'Laptop',
    chineseLabel: '笔记本电脑',
    weight: 2,
    image: '/img/macbook.png',
    showLabel: true
  },
  {
    label: 'MPOS Umbrella',
    chineseLabel: 'MPOS遮阳伞',
    weight: 2,
    image: '/img/umbrellar.png',
    showLabel: true
  },
  {
    label: 'Store Promotional Video',
    chineseLabel: '门店宣传片拍摄',
    weight: 2,
    image: '/img/video.png',
    showLabel: true
  },
  {
    label: 'P10 rolls of thermal paper',
    chineseLabel: '打印纸10卷',
    weight: 2,
    image: '/img/paper.png',
    showLabel: true
  },
  {
    label: 'MPOS tissue box',
    chineseLabel: 'MPOS纸巾盒​',
    weight: 2,
    image: '/img/tissue-box.png',
    showLabel: true
  },
  {
    label: 'Thermal Printer',
    chineseLabel: '热敏打印机',
    weight: 2,
    image: '/img/printer.png',
    showLabel: true
  }
];

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
  lineColor: '#fff',
  items: []
};

const container = ref();
const isSpinning = ref(false);

let spinCount = 0;
let wheel: Wheel | undefined = undefined;

const spin = () => {
  if (!wheel) return;

  wheel.onCurrentIndexChange = () => {
    if (!wheel) return;

    // Change rotation resistance based on current speed.
    // Provide a more entertaining performance.
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

  wheel.rotationResistance = -400;
  wheel.spin(wheel.rotationSpeed + random.int(1000, 1600));
};

onMounted(() => {
  // Process mock items for the wheel
  const processedItems = mockItems.map((item) => {
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

  wheel = new Wheel(container.value, {
    ...properties,
    items: processedItems
  });

  wheel.spin(10);

  wheel.onRest = ($event) => {
    console.log('Spin ended on:', $event);
    isSpinning.value = false;
  };

  wheel.onSpin = () => {
    console.log('Spin started');
    isSpinning.value = true;
  };

  // Workaround for itemLabelRadiusMax not working on first load.
  setTimeout(() => {
    if (wheel) {
      wheel.itemLabelRadiusMax = 0.3;
    }
  }, 50);
});
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
}
</style>
