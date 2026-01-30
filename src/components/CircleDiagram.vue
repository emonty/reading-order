<template>
  <div class="circle-diagram">
    <svg
      ref="svgRef"
      class="circle-diagram-svg"
      viewBox="0 0 1000 1000"
    >
      <defs>
        <marker
          v-for="(type, typeId) in connectionTypes"
          :id="`triangle-${typeId}`"
          :key="typeId"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerUnits="strokeWidth"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            :fill="type.color"
          />
        </marker>
        <marker
          id="triangle-mask"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerUnits="strokeWidth"
          markerWidth="4"
          markerHeight="4"
          orient="auto"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill="#FFFFFF"
          />
        </marker>
        <linearGradient
          id="shine-x"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop
            offset="0%"
            style="stop-color:rgb(255,255,255);stop-opacity:0"
          />
          <stop
            offset="50%"
            style="stop-color:rgb(255,255,255);stop-opacity:1"
          />
          <stop
            offset="100%"
            style="stop-color:rgb(255,255,255);stop-opacity:0"
          />
        </linearGradient>
        <linearGradient
          id="shine-y"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            style="stop-color:rgb(255,255,255);stop-opacity:0"
          />
          <stop
            offset="50%"
            style="stop-color:rgb(255,255,255);stop-opacity:1"
          />
          <stop
            offset="100%"
            style="stop-color:rgb(255,255,255);stop-opacity:0"
          />
        </linearGradient>
      </defs>
      <g
        id="circle-viewport"
        ref="viewportRef"
      >
        <image
          x="300"
          y="300"
          width="400"
          height="400"
          opacity="0.05"
          xlink:href="@/assets/cosmere.svg"
        />
        <CircleEntry
          v-for="entry in entries"
          :key="`entry-${entry.id}`"
          :entry="entry"
          :angle="entry.angle"
          :radius="300"
          :mute="selectedEntry !== null && entry.id !== selectedEntry
            && !incomingConnections[entry.id].includes(selectedEntry)
            && !(entry.connections || [])
              .some(c => connectionTypes[c.type].active && c.target === selectedEntry)"
          @select="select(entry.id, $event)"
          @unselect="unselect(entry.id)"
        >
          {{ entry.title }}
        </CircleEntry>
        <Arc
          v-for="c in connections"
          :key="`arc-${c.startId}.${c.endId}`"
          :connection="c"
          :radius="290"
          :mute="selectedEntry !== null
            && selectedEntry !== c.startId && selectedEntry !== c.endId"
          :highlight="selectedEntry !== null
            && (selectedEntry === c.startId || selectedEntry === c.endId)"
        />
        <CircleLabel
          v-for="(label, i) in labels"
          :key="`label-${i}`"
          :label="label"
          :hover-depth="labelHoverDepth"
          @begin-hover="beginLabelHover"
          @end-hover="endLabelHover"
        />
      </g>
    </svg>
  </div>
</template>

<script>
import panzoom from 'panzoom';
import { useAppStore } from '@/stores/app';
import { storeToRefs } from 'pinia';
import CircleEntry from '@/components/CircleEntry.vue';
import Arc from '@/components/Arc.vue';
import CircleLabel from '@/components/CircleLabel.vue';

export default {
  name: 'CircleDiagram',
  components: {
    CircleLabel, CircleEntry, Arc,
  },
  props: {
    entries: {
      type: Object,
      required: true,
    },
    connectionTypes: Object,
    labels: Array,
  },
  setup() {
    const store = useAppStore();
    const { highlightSeries, selectedEntry } = storeToRefs(store);
    return { store, highlightSeries, selectedEntry };
  },
  data() {
    return {
      selectionLock: false,
      labelHoverDepth: null,
      labelHoverLockDepth: null,
      panzoomInstance: null,
    };
  },
  computed: {
    incomingConnections() {
      const connections = {};

      Object.values(this.entries).forEach((e) => {
        connections[e.id] = connections[e.id] || [];

        (e.connections || []).filter(c => this.connectionTypes[c.type].active).forEach((c) => {
          connections[c.target] = [...(connections[c.target] || []), e.id];
        });
      });

      return connections;
    },
    connections() {
      const isActive = entry => entry.categories.every(c => c.active);
      return Object.values(this.entries)
        .flatMap(e => (e.connections || [])
          .filter(c => this.entries[c.target] !== undefined)
          .map(c => ({
            description: c.description,
            startId: e.id,
            endId: c.target,
            start: e.angle,
            end: this.entries[c.target].angle,
            type: this.connectionTypes[c.type],
            nodesActive: isActive(e) && isActive(this.entries[c.target]),
          })));
    },
  },
  watch: {
    highlightSeries(value) {
      if (value) {
        this.setLabelHoverLock(1);
      } else {
        this.endLabelHoverLock();
      }
    },
  },
  mounted() {
    if (this.highlightSeries) {
      this.setLabelHoverLock(1);
    }
    // Initialize panzoom on the viewport group
    this.panzoomInstance = panzoom(this.$refs.viewportRef, {
      minZoom: 0.5,
      maxZoom: 4,
      bounds: true,
      boundsPadding: 0.1,
    });
  },
  unmounted() {
    if (this.panzoomInstance) {
      this.panzoomInstance.dispose();
    }
  },
  methods: {
    select(entry, lock) {
      if (this.selectionLock && entry !== this.selectedEntry) {
        return;
      }

      this.store.selectEntry(entry);
      this.selectionLock = lock;
    },
    unselect(entry) {
      if (this.selectionLock && entry !== this.selectedEntry) {
        return;
      }

      this.store.selectEntry(null);
      this.selectionLock = false;
    },
    beginLabelHover(depth) {
      if (this.labelHoverLockDepth === null) {
        this.labelHoverDepth = depth;
      } else if (depth < this.labelHoverLockDepth) {
        this.labelHoverDepth = depth;
      }
    },
    endLabelHover() {
      if (this.labelHoverLockDepth === null) {
        this.labelHoverDepth = null;
      } else {
        this.labelHoverDepth = this.labelHoverLockDepth;
      }
    },
    setLabelHoverLock(depth) {
      this.labelHoverLockDepth = depth;
      this.labelHoverDepth = depth;
    },
    endLabelHoverLock() {
      this.labelHoverDepth = null;
      this.labelHoverLockDepth = null;
    },
  },
};
</script>

<style lang="scss">
.circle-diagram {
  position: relative;
  font-family: serif;
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  align-items: stretch;

  &-svg {
    flex-grow: 1;

    // Remove focus outlines from SVG elements
    &:focus,
    & *:focus {
      outline: none;
    }
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 1s ease-in-out;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0 !important;
}
</style>
