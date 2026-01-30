import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    showSpoilers: localStorage.getItem('showSpoilers') === 'true'
      || localStorage.getItem('explainConnections') === 'true',
    highlightSeries: localStorage.getItem('highlightSeries') === 'true',
    selectedEntry: null,
  }),
  actions: {
    toggleExplanations(value) {
      this.showSpoilers = value;
      localStorage.setItem('showSpoilers', value);
    },
    toggleSeriesHighlight(value) {
      this.highlightSeries = value;
      localStorage.setItem('highlightSeries', value);
    },
    selectEntry(entry) {
      this.selectedEntry = entry;
    },
  },
});

// Migration cleanup - run once on import
localStorage.setItem('showSpoilers', localStorage.getItem('showSpoilers') === 'true'
  || localStorage.getItem('explainConnections') === 'true');
localStorage.removeItem('explainConnections');
