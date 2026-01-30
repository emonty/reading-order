<template>
  <div
    class="home"
    @drop.capture.stop.prevent="loadLocalFile"
    @dragenter.capture="captureDrop"
    @dragover.capture="captureDrop"
  >
    <SideLegend
      :connection-types="Object.values(connectionTypes)"
      :layers="layers"
      :appearances="appearances"
      :sorted-books="sortedBooks"
      @sort="sort"
    />
    <CircleDiagram
      v-if="viewMode === 'circular'"
      :entries="entries"
      :connection-types="connectionTypes"
      :labels="entries === books ? labels : []"
    />
    <LinearDiagram
      v-else-if="viewMode === 'linear'"
      :entries="entries"
      :connection-types="connectionTypes"
      :labels="entries === books ? labels : []"
    />
    <InfoBox
      v-if="selectedEntry !== null"
      :entry="entries[selectedEntry]"
    />
  </div>
</template>

<script>
import { reactive } from 'vue';
import { useAppStore } from '@/stores/app';
import { storeToRefs } from 'pinia';
import CircleDiagram from '@/components/CircleDiagram.vue';
import LinearDiagram from '@/components/LinearDiagram.vue';
import loader from '@/loader';
import SideLegend from '@/components/SideLegend.vue';
import InfoBox from '@/components/InfoBox.vue';

function buildDefaultSettings(query) {
  const defaultSettings = {};
  const categories = ['connections', 'categories', 'appearances'];

  categories.forEach((c) => {
    defaultSettings[c] = {};
  });

  Object.keys(query || {}).forEach((k) => {
    categories.forEach((c) => {
      if (k === c && (query[k] === 'all' || query[k] === 'none')) {
        defaultSettings[c] = query[k];
        return;
      }
      if (!k.startsWith(`${c}.`) || !(defaultSettings[c] instanceof Object)) {
        return;
      }

      const id = k.substring(c.length + 1);
      defaultSettings[c][id] = query[k] === 'true';
    });
  });

  if (query.layer) {
    defaultSettings.layer = query.layer;
  }

  return defaultSettings;
}

export default {
  name: 'Home',
  components: {
    InfoBox,
    SideLegend,
    CircleDiagram,
    LinearDiagram,
  },
  setup() {
    const store = useAppStore();
    const { selectedEntry } = storeToRefs(store);
    return { selectedEntry };
  },
  data() {
    return {
      entries: {},
      books: {},
      sortedBooks: [],
      connectionTypes: {},
      layers: [],
      appearances: [],
      labels: [],
    };
  },
  computed: {
    viewMode() {
      const mode = this.$route.query.view;
      return mode === 'linear' ? 'linear' : 'circular';
    },
  },
  async mounted() {
    const result = await (await fetch('./data.json')).json();
    this.loadData(result);
  },
  methods: {
    loadData(data) {
      const {
        books, sorted, connectionTypes, layers, appearances, labels,
      } = loader(data, buildDefaultSettings(this.$route.query));

      // Make category objects reactive so changes propagate correctly in Vue 3
      // This is needed because books hold direct references to category objects
      // and Vue 3's reactivity doesn't automatically track shared object references
      const reactiveCategories = {};

      // First pass: create reactive categories and store them
      const reactiveLayers = layers.map((layer) => {
        const reactiveLayer = reactive({ ...layer, categories: [] });
        reactiveLayer.categories = layer.categories.map((c) => {
          const reactiveCategory = reactive({ ...c, layer: reactiveLayer });
          reactiveCategories[c.id] = reactiveCategory;
          return reactiveCategory;
        });
        return reactiveLayer;
      });

      // Update book category references and redefine the active getter
      // The original getter uses a closure variable, so we need to replace it
      // with one that uses this.categories (which will be reactive)
      Object.values(books).forEach((book) => {
        book.categories = book.categories.map(c => reactiveCategories[c.id]);
        // Redefine the active getter to use this.categories instead of closure
        Object.defineProperty(book, 'active', {
          get() {
            return this.categories.every(c => c.active);
          },
          configurable: true,
        });
      });

      // Also update sorted books
      sorted.forEach((s) => {
        Object.values(s.books).forEach((book) => {
          book.categories = book.categories.map(c => reactiveCategories[c.id]);
          Object.defineProperty(book, 'active', {
            get() {
              return this.categories.every(c => c.active);
            },
            configurable: true,
          });
        });
      });

      this.entries = books;
      this.books = books;
      this.sortedBooks = sorted;
      this.connectionTypes = connectionTypes;
      this.layers = reactiveLayers;
      this.appearances = appearances;
      this.labels = labels;
    },
    sort(books) {
      this.entries = books === false ? this.books : books;
    },
    loadLocalFile(event) {
      const file = event.dataTransfer.files[0];

      if (file === undefined || !file.type.match('application.json')) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const reader = new FileReader();

      // Closure to capture the file information.
      reader.onload = (e) => {
        const { result } = e.target;
        try {
          this.loadData(JSON.parse(result));
        } catch (error) {
          // eslint-disable-next-line no-alert
          alert(`Could not load data JSON: ${error}`);
        }
      };

      // Read in the image file as a data URL.
      reader.readAsText(file);
    },
    captureDrop(event) {
      event.dataTransfer.dropEffect = 'move';
      event.preventDefault();
    },
  },
};
</script>

<style lang="scss">
.home {
  display: flex;
  margin: 0 auto;
  align-items: stretch;
  height: 100vh;
}
</style>
