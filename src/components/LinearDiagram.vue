<template>
<SvgPanZoom class="linear-diagram" :dbl-click-zoom-enabled="false"
            :custom-events-handler="panEventHandler">
  <svg class="linear-diagram-svg" :viewBox="svgViewBox" preserveAspectRatio="xMinYMin meet">
    <defs>
      <marker :id="`triangle-${typeId}`" viewBox="0 0 10 10"
              refX="5" refY="5"
              markerUnits="strokeWidth"
              markerWidth="4" markerHeight="4"
              orient="auto"
              v-for="(type, typeId) in connectionTypes"
              :key="typeId">
        <path d="M 0 0 L 10 5 L 0 10 z" :fill="type.color"/>
      </marker>
      <marker id="triangle-mask" viewBox="0 0 10 10"
              refX="5" refY="5"
              markerUnits="strokeWidth"
              markerWidth="4" markerHeight="4"
              orient="auto">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#FFFFFF"/>
      </marker>
      <linearGradient id="shine-x" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:rgb(255,255,255);stop-opacity:0"/>
        <stop offset="50%" style="stop-color:rgb(255,255,255);stop-opacity:1"/>
        <stop offset="100%" style="stop-color:rgb(255,255,255);stop-opacity:0"/>
      </linearGradient>
      <linearGradient id="shine-y" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:rgb(255,255,255);stop-opacity:0"/>
        <stop offset="50%" style="stop-color:rgb(255,255,255);stop-opacity:1"/>
        <stop offset="100%" style="stop-color:rgb(255,255,255);stop-opacity:0"/>
      </linearGradient>
    </defs>
    <g :transform="`translate(0, ${topPadding})`" class="svg-pan-zoom_viewport">
      <LinearArc
        :connection="c"
        :mute="selectedEntry !== null
               && selectedEntry !== c.startId && selectedEntry !== c.endId"
        :highlight="selectedEntry !== null
                    && (selectedEntry === c.startId || selectedEntry === c.endId)"
        :row-height="rowHeight"
        :margin-left="arcMargin"
        :key="`arc-${c.startId}.${c.endId}`"
        v-for="c in connections"
      ></LinearArc>
      <LinearEntry
        :entry="entry"
        :y="entryPositions[entry.id]"
        :x="entryLeft"
        :mute="selectedEntry !== null && entry.id !== selectedEntry
               && !incomingConnections[entry.id].includes(selectedEntry)
               && !(entry.connections || [])
                    .some(c => connectionTypes[c.type].active && c.target === selectedEntry)"
        @select="select(entry.id, $event)"
        @unselect="unselect(entry.id)"
        :key="`entry-${entry.id}`"
        v-for="entry in sortedEntries"
      >
      </LinearEntry>
    </g>
  </svg>
</SvgPanZoom>
</template>

<script>
import Hammer from 'hammerjs';
import SvgPanZoom from 'vue-svg-pan-zoom';
import { mapState } from 'vuex';
import LinearEntry from '@/components/LinearEntry.vue';
import LinearArc from '@/components/LinearArc.vue';

export default {
  name: 'LinearDiagram',
  components: {
    SvgPanZoom,
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
  data() {
    const panEventHandler = {
      haltEventListeners: ['touchstart', 'touchend', 'touchmove', 'touchleave', 'touchcancel'],
      init(options) {
        const { instance } = options;
        let initialScale = 1;
        let pannedX = 0;
        let pannedY = 0;
        this.hammer = Hammer(options.svgElement, {
          inputClass: Hammer.SUPPORT_POINTER_EVENTS ? Hammer.PointerEventInput : Hammer.TouchInput,
        });
        this.hammer.get('pinch').set({ enable: true });

        this.hammer.on('panstart panmove', (ev) => {
          if (ev.type === 'panstart') {
            pannedX = 0;
            pannedY = 0;
          }
          instance.panBy({ x: ev.deltaX - pannedX, y: ev.deltaY - pannedY });
          pannedX = ev.deltaX;
          pannedY = ev.deltaY;
        });

        this.hammer.on('pinchstart pinchmove', (ev) => {
          if (ev.type === 'pinchstart') {
            initialScale = instance.getZoom();
            instance.zoomAtPoint(initialScale * ev.scale, { x: ev.center.x, y: ev.center.y });
          }
          instance.zoomAtPoint(initialScale * ev.scale, { x: ev.center.x, y: ev.center.y });
        });

        options.svgElement.addEventListener('touchmove', (e) => {
          e.preventDefault();
        });
      },
      destroy() {
        this.hammer.destroy();
      },
    };

    return {
      selectionLock: false,
      rowHeight: 40,
      arcMargin: 100,
      entryLeft: 110,
      topPadding: 20,
      svgWidth: 800,
      panEventHandler,
    };
  },
  computed: {
    ...mapState(['selectedEntry']),
    sortedEntries() {
      // Use entries in the order they're passed (already sorted by Home.vue based on selector)
      // Filter out inactive entries so they disappear when categories are toggled off
      return Object.values(this.entries).filter(e => e.active);
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
    svgHeight() {
      return this.sortedEntries.length * this.rowHeight + this.topPadding * 2;
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
            nodesActive: e.active && this.entries[c.target].active,
          })))
        .filter(c => c.startIndex !== undefined && c.endIndex !== undefined);
    },
  },
  methods: {
    select(entry, lock) {
      if (this.selectionLock && entry !== this.selectedEntry) {
        return;
      }

      this.$store.commit('selectEntry', entry);
      this.selectionLock = lock;
    },
    unselect(entry) {
      if (this.selectionLock && entry !== this.selectedEntry) {
        return;
      }

      this.$store.commit('selectEntry', null);
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
  }
}
</style>
