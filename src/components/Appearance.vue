<template>
  <g
    v-tooltip="{
      content: showSpoilers
        ? appearance.description
        : 'Spoilers ahead! Enable spoilers in the options to the right to see them!',
      triggers: ['click', 'hover'],
      html: true,
    }"
    :class="['appearance', `appearance-${appearance.type}`]"
    :transform="`translate(0, ${-position}) rotate(${rotation})`"
    :style="{'--appearance-color': appearance.ref.color}"
  >
    <circle r="10" />
    <text
      dominant-baseline="central"
      text-anchor="middle"
      font-size="0.8rem"
    >
      {{ appearance.ref.initial }}
    </text>
  </g>
</template>

<script>
import { useAppStore } from '@/stores/app';
import { storeToRefs } from 'pinia';

export default {
  name: 'Appearance',
  props: {
    appearance: Object,
    position: Number,
    rotation: Number,
  },
  setup() {
    const store = useAppStore();
    const { showSpoilers } = storeToRefs(store);
    return { showSpoilers };
  },
};
</script>

<style lang="scss">
.appearance {
  font-family: sans-serif;
  cursor: help;

  &-appearance {
    circle {
      fill: var(--appearance-color, #fafafa);
    }

    text {
      fill: #111;
    }
  }

  &-mention {
    circle {
      stroke: var(--appearance-color, #fafafa);
      fill: transparent;
    }

    text {
      fill: var(--appearance-color, #fafafa);
    }
  }
}
</style>
