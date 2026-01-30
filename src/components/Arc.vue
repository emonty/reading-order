<template>
  <g
    :class="[
      'arc',
      {
        'arc-nodes-inactive': !connection.nodesActive,
        'arc-inactive': !connection.type.active,
        'arc-muted': mute
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
      class="arc-background"
      fill="none"
      :style="bgStyles"
      @mouseover="beginLocalHighlight"
      @mouseout="endLocalHighlight"
    />
    <path
      :d="path"
      class="arc-foreground"
      fill="none"
      :style="styles"
      :marker-end="`url(#triangle-${connection.type.id})`"
    />
    <mask :id="`arc-path-${renderedStart}.${renderedEnd}`">
      <path
        :d="path"
        class="arc-foreground"
        fill="none"
        stroke="white"
        :stroke-width="connection.type.width"
        marker-end="url(#triangle-mask)"
      />
    </mask>
    <g
      v-if="highlight || localHighlight"
      class="arc-shine-container"
      :mask="`url(#arc-path-${renderedStart}.${renderedEnd})`"
    >
      <rect
        :x="shineRectangle.x"
        :y="shineRectangle.y"
        :width="shineRectangle.width"
        :height="shineRectangle.height"
        :fill="`url(#shine-${shineAxis})`"
        :style="{'--shine-distance': `${shineDistance}px`}"
        :class="['arc-shine', `arc-shine-${shineAxis}`]"
      />
    </g>
  </g>
</template>

<script>
import { TweenLite } from 'gsap/gsap-core';
import { useAppStore } from '@/stores/app';
import { storeToRefs } from 'pinia';
import { angleDifference, normalizeAngle } from '@/utils';

function invertSeparation(separation) {
  return separation - Math.sign(separation);
}

export default {
  name: 'Arc',
  props: {
    connection: Object,
    radius: {
      type: Number,
      default: 200,
    },
    mute: Boolean,
    highlight: Boolean,
  },
  setup() {
    const store = useAppStore();
    const { showSpoilers } = storeToRefs(store);
    return { showSpoilers };
  },
  data() {
    return {
      renderedStart: normalizeAngle(this.connection.start),
      renderedEnd: normalizeAngle(this.connection.end),
      localHighlight: false,
      mousePos: { pageX: 0, pageY: 0 },
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
    startPos() {
      const offset = 1.5 * invertSeparation(this.signedSeparation);
      const startRadians = Math.PI * (this.renderedStart - 90 - offset) / 180;
      return {
        x: Math.cos(startRadians) * this.radius + 500,
        y: Math.sin(startRadians) * this.radius + 500,
      };
    },
    endPos() {
      const offset = 1.5 * invertSeparation(this.signedSeparation);
      const endRadians = Math.PI * (this.renderedEnd - 90 + offset) / 180;
      return {
        x: Math.cos(endRadians) * this.radius + 500,
        y: Math.sin(endRadians) * this.radius + 500,
      };
    },
    signedSeparation() {
      return angleDifference(this.renderedStart, this.renderedEnd) / 180;
    },
    separation() {
      return Math.abs(this.signedSeparation) ** 0.7;
    },
    control1Pos() {
      return {
        x: (1 - this.separation) * this.startPos.x + this.separation * 500,
        y: (1 - this.separation) * this.startPos.y + this.separation * 500,
      };
    },
    control2Pos() {
      return {
        x: (1 - this.separation) * this.endPos.x + this.separation * 500,
        y: (1 - this.separation) * this.endPos.y + this.separation * 500,
      };
    },
    path() {
      return `
      M ${this.startPos.x} ${this.startPos.y}
      C ${this.control1Pos.x} ${this.control1Pos.y}
        ${this.control2Pos.x} ${this.control2Pos.y}
        ${this.endPos.x} ${this.endPos.y}
      `;
    },
    slope() {
      return (this.endPos.y - this.startPos.y) / (this.endPos.x - this.startPos.x);
    },
    shineDistance() {
      const distance = this.endPos[this.shineAxis] - this.startPos[this.shineAxis];
      return distance + Math.sign(distance) * 20;
    },
    shineAxis() {
      return Math.abs(this.slope) > 1 ? 'y' : 'x';
    },
    shineRectangle() {
      if (this.shineAxis === 'x') {
        const height = Math.abs(this.endPos.x - this.startPos.x) * 2;
        return {
          x: this.startPos.x - 10,
          y: (this.startPos.y + this.endPos.y) / 2 - height / 2,
          width: 20,
          height,
        };
      }

      const width = Math.abs(this.endPos.y - this.startPos.y) * 2;
      return {
        x: (this.startPos.x + this.endPos.x) / 2 - width / 2,
        y: this.startPos.y - 10,
        width,
        height: 20,
      };
    },
  },
  watch: {
    'connection.start': function handle(newStart) {
      TweenLite.to(
        this.$data,
        1,
        { renderedStart: normalizeAngle(newStart), ease: 'Power1.easeInOut' },
      );
    },
    'connection.end': function handle(newEnd) {
      TweenLite.to(
        this.$data,
        1,
        { renderedEnd: normalizeAngle(newEnd), ease: 'Power1.easeInOut' },
      );
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
.arc {
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

    &-x {
      animation-name: shine-x;
    }

    &-y {
      animation-name: shine-y;
    }
  }
}

@keyframes shine-x {
  0% {
    transform: translateX(-20px);
  }

  100% {
    transform: translateX(var(--shine-distance));
  }
}

@keyframes shine-y {
  0% {
    transform: translateY(-20px);
  }

  100% {
    transform: translateY(var(--shine-distance));
  }
}
</style>
