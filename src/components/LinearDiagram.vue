<template>
  <div class="linear-diagram">
    <svg
      ref="svgRef"
      class="linear-diagram-svg"
      :viewBox="svgViewBox"
      preserveAspectRatio="xMinYMin slice"
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
        id="linear-viewport"
        ref="viewportRef"
        :transform="`translate(0, ${topPadding})`"
      >
        <LinearArc
          v-for="c in connections"
          :key="`arc-${c.startId}.${c.endId}`"
          :connection="c"
          :mute="selectedEntry !== null
            && selectedEntry !== c.startId && selectedEntry !== c.endId"
          :highlight="selectedEntry !== null
            && (selectedEntry === c.startId || selectedEntry === c.endId)"
          :row-height="rowHeight"
          :margin-left="arcMargin"
        />
        <LinearEntry
          v-for="entry in sortedEntries"
          :key="`entry-${entry.id}`"
          :entry="entry"
          :y="entryPositions[entry.id]"
          :x="entryLeft"
          :mute="selectedEntry !== null && entry.id !== selectedEntry
            && !incomingConnections[entry.id].includes(selectedEntry)
            && !(entry.connections || [])
              .some(c => connectionTypes[c.type].active && c.target === selectedEntry)"
          @select="select(entry.id, $event)"
          @unselect="unselect(entry.id)"
        />
      </g>
    </svg>
  </div>
</template>

<script>
import panzoom from 'panzoom';
import { useAppStore } from '@/stores/app';
import { storeToRefs } from 'pinia';
import LinearEntry from '@/components/LinearEntry.vue';
import LinearArc from '@/components/LinearArc.vue';

export default {
  name: 'LinearDiagram',
  components: {
    LinearEntry,
    LinearArc,
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
    const { selectedEntry } = storeToRefs(store);
    return { store, selectedEntry };
  },
  data() {
    return {
      selectionLock: false,
      rowHeight: 40,
      arcMargin: 100,
      entryLeft: 110,
      topPadding: 20,
      svgWidth: 800,
      svgHeight: 3000, // Fixed height - panzoom handles navigation
      panzoomInstance: null,
    };
  },
  computed: {
    sortedEntries() {
      // Use entries in the order they're passed (already sorted by Home.vue based on selector)
      // Filter out inactive entries so they disappear when categories are toggled off
      const isActive = entry => entry.categories.every(c => c.active);
      return Object.values(this.entries).filter(e => isActive(e));
    },
    entryPositions() {
      // Map entry IDs to their Y positions
      const positions = {};
      this.sortedEntries.forEach((entry, index) => {
        positions[entry.id] = index * this.rowHeight;
      });
      return positions;
    },
    entryIndices() {
      // Map entry IDs to their indices in the sorted list
      const indices = {};
      this.sortedEntries.forEach((entry, index) => {
        indices[entry.id] = index;
      });
      return indices;
    },
    svgViewBox() {
      return `0 0 ${this.svgWidth} ${this.svgHeight}`;
    },
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
            startIndex: this.entryIndices[e.id],
            endIndex: this.entryIndices[c.target],
            type: this.connectionTypes[c.type],
            nodesActive: isActive(e) && isActive(this.entries[c.target]),
          })))
        .filter(c => c.startIndex !== undefined && c.endIndex !== undefined);
    },
  },
  mounted() {
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
  },
};
</script>

<style lang="scss">
.linear-diagram {
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
</style>
