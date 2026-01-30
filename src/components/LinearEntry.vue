<template>
  <g
    :class="['linear-entry', {'linear-entry-inactive': !isActive, 'linear-entry-muted': mute}]"
    :transform="`translate(${x}, ${y})`"
  >
    <rect
      class="linear-entry-color-bar"
      :x="0"
      :y="-15"
      width="4"
      height="30"
      :fill="categoryColor"
    />
    <text
      ref="text"
      v-closable="{handler: handleOutsideClick, exclude: shouldNotClose}"
      x="12"
      y="0"
      dominant-baseline="central"
      text-anchor="start"
      :style="textStyles"
      @mouseover="select"
      @mouseout="unselect"
      @click="toggle"
    >
      {{ entry.title }}
    </text>
    <AppearanceGroup
      v-if="textWidth >= 0"
      :appearances="entry.appearances.filter(a => a.ref.active)"
      :rotation="0"
      :transform="`translate(${textWidth + 24}, 0)`"
    />
  </g>
</template>

<script>
import { isInInfoBox } from '@/utils';
import AppearanceGroup from '@/components/AppearanceGroup.vue';

export default {
  name: 'LinearEntry',
  components: { AppearanceGroup },
  props: {
    entry: Object,
    x: {
      type: Number,
      default: 0,
    },
    y: Number,
    mute: Boolean,
  },
  data() {
    return {
      textWidth: -1,
      clicked: false,
    };
  },
  computed: {
    isActive() {
      return this.entry.categories.every(c => c.active);
    },
    categoryColor() {
      for (let i = 0; i < this.entry.categories.length; i += 1) {
        const category = this.entry.categories[i];
        if (category.layer.active && category.color !== undefined) {
          return category.color;
        }
      }
      return '#fafafa';
    },
    textStyles() {
      let color;
      for (let i = 0; i < this.entry.categories.length; i += 1) {
        const category = this.entry.categories[i];
        if (category.layer.active && category.color !== undefined) {
          // eslint-disable-next-line prefer-destructuring
          color = category.color;
          break;
        }
      }

      let style;
      for (let i = 0; i < this.entry.categories.length; i += 1) {
        const category = this.entry.categories[i];
        if (category.style !== undefined) {
          // eslint-disable-next-line prefer-destructuring
          style = category.style;
          break;
        }
      }

      return {
        fill: color,
        fontStyle: style,
      };
    },
  },
  mounted() {
    this.textWidth = this.$refs.text.getComputedTextLength();
  },
  methods: {
    toggle() {
      if (!this.isActive) {
        return;
      }

      this.clicked = !this.clicked;

      if (this.clicked) {
        this.$emit('select', true);
      } else {
        this.$emit('unselect');
      }
    },
    select() {
      if (!this.isActive) {
        return;
      }

      if (!this.clicked) {
        this.$emit('select', false);
      }
    },
    unselect() {
      if (!this.clicked) {
        this.$emit('unselect');
      }
    },
    handleOutsideClick() {
      if (this.clicked) {
        this.clicked = false;
        this.unselect();
      }
    },
    shouldNotClose(target) {
      if (this.clicked) {
        return isInInfoBox(target);
      }

      return false;
    },
  },
};
</script>

<style lang="scss">
.linear-entry {
  transition: opacity 0.2s ease-in-out;

  & > text {
    fill: #fafafa;
  }

  & > text:hover {
    cursor: pointer;
  }

  &-inactive {
    opacity: 0.1;
  }

  &-muted {
    opacity: 0.1;
    pointer-events: none;
  }

  &-color-bar {
    opacity: 0.8;
  }
}
</style>
