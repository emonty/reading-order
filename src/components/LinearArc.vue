<template>
  <g
    :class="[
      'linear-arc',
      {
        'linear-arc-nodes-inactive': !connection.nodesActive,
        'linear-arc-inactive': !connection.type.active,
        'linear-arc-muted': mute
      }
    ]"
  >
    <path
      v-tooltip="{
        content: showSpoilers
          ? connection.description
          : 'Spoilers ahead! Enable spoilers in the options to the right to see them!',
        disabled: mute,
        html: true,
        triggers: ['hover', 'click'],
        popperTriggers: ['hover'],
        autoHide: true,
      }"
      :d="path"
      class="linear-arc-background"
      fill="none"
      :style="bgStyles"
      @mouseover="beginLocalHighlight"
      @mouseout="endLocalHighlight"
    />
    <path
      :d="path"
      class="linear-arc-foreground"
      fill="none"
      :style="styles"
      :marker-end="`url(#triangle-${connection.type.id})`"
    />
    <mask :id="`linear-arc-path-${connection.startId}.${connection.endId}`">
      <path
        :d="path"
        class="linear-arc-foreground"
        fill="none"
        stroke="white"
        :stroke-width="connection.type.width"
        marker-end="url(#triangle-mask)"
      />
    </mask>
    <g
      v-if="highlight || localHighlight"
      class="linear-arc-shine-container"
      :mask="arcMask"
    >
      <rect
        :x="shineRectangle.x"
        :y="shineRectangle.y"
        :width="shineRectangle.width"
        :height="shineRectangle.height"
        fill="url(#shine-y)"
        :style="{'--shine-distance': `${shineDistance}px`}"
        class="linear-arc-shine linear-arc-shine-y"
      />
    </g>
  </g>
</template>

<script>
import { useAppStore } from '@/stores/app';
import { storeToRefs } from 'pinia';

export default {
  name: 'LinearArc',
  props: {
    connection: Object,
    mute: Boolean,
    highlight: Boolean,
    rowHeight: {
      type: Number,
      default: 40,
    },
    marginLeft: {
      type: Number,
      default: 120,
    },
  },
  setup() {
    const store = useAppStore();
    const { showSpoilers } = storeToRefs(store);
    return { showSpoilers };
  },
  data() {
    return {
      localHighlight: false,
    };
  },
  computed: {
    styles() {
      return {
        stroke: this.connection.type.color,
        strokeWidth: this.connection.type.width,
        strokeDasharray: this.connection.type.dash,
      };
    },
    bgStyles() {
      return {
        stroke: this.connection.type.highlightColor,
        strokeWidth: 10,
      };
    },
    startY() {
      return this.connection.startIndex * this.rowHeight;
    },
    endY() {
      return this.connection.endIndex * this.rowHeight;
    },
    distance() {
      return Math.abs(this.connection.endIndex - this.connection.startIndex);
    },
    curveDepth() {
      // Curve outward more for connections that span more entries
      // Use a logarithmic scale to prevent extremely wide curves
      const baseDepth = 20;
      const scaleFactor = 15;
      return baseDepth + Math.log2(this.distance + 1) * scaleFactor;
    },
    startX() {
      return this.marginLeft;
    },
    endX() {
      return this.marginLeft;
    },
    controlX() {
      return this.marginLeft - this.curveDepth;
    },
    path() {
      // Cubic bezier curving to the left
      return `
        M ${this.startX} ${this.startY}
        C ${this.controlX} ${this.startY}
          ${this.controlX} ${this.endY}
          ${this.endX} ${this.endY}
      `;
    },
    shineDistance() {
      return this.endY - this.startY + 20;
    },
    shineRectangle() {
      const width = this.curveDepth * 2;
      return {
        x: this.marginLeft - this.curveDepth - 10,
        y: this.startY - 10,
        width,
        height: 20,
      };
    },
    arcMask() {
      const { startId, endId } = this.connection;
      return `url(#linear-arc-path-${startId}.${endId})`;
    },
  },
  methods: {
    beginLocalHighlight() {
      this.localHighlight = true;
    },
    endLocalHighlight() {
      this.localHighlight = false;
    },
  },
};
</script>

<style lang="scss">
.linear-arc {
  transition: opacity 0.2s ease-in-out;
  opacity: 1;

  &-nodes-inactive {
    opacity: 0.1;
    pointer-events: none;
  }

  &-muted {
    opacity: 0.1;
    pointer-events: none;
  }

  &-inactive {
    opacity: 0;
    pointer-events: none;
  }

  &-background {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    outline: none;

    &:hover {
      opacity: 0.25;
    }
  }

  &-foreground {
    pointer-events: none;
  }

  &-shine {
    opacity: 0.5;
    animation-timing-function: ease-out;
    animation-iteration-count: infinite;
    animation-duration: 5s;

    &-container {
      pointer-events: none;
    }

    &-y {
      animation-name: shine-y;
    }
  }
}
</style>
