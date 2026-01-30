<template>
  <div
    v-tooltip.left="{
      content: type.details,
      triggers: ['hover', 'click'],
      html: true,
    }"
    :class="['connection-preview', {'connection-preview-active': type.active}]"
  >
    <input
      :id="`chk-connection-${type.id}`"
      v-model="type.active"
      type="checkbox"
    >
    <label :for="`chk-connection-${type.id}`">
      <svg
        width="15"
        height="10"
        viewBox="0 0 15 5"
        class="connection-preview-icon"
      >
        <line
          x1="0"
          y1="3"
          x2="15"
          y2="3"
          :stroke="type.color"
          :stroke-width="type.width"
          :stroke-dasharray="type.dash"
        />
      </svg>
      {{ type.description }}
    </label>
  </div>
</template>

<script>
export default {
  name: 'ConnectionPreview',
  props: {
    type: Object,
  },
  watch: {
    'type.active': function handle(active) {
      this.$emit('update-route', { id: this.type.id, active });
    },
    $route(to) {
      if (to.query.connections === 'all' || to.query.connections === 'none') {
        this.type.active = to.query.connections === 'all';
      } else if (to.query[`connections.${this.type.id}`] !== undefined) {
        this.type.active = to.query[`connections.${this.type.id}`] === 'true';
      }
    },
  },
};
</script>

<style lang="scss">
.connection-preview {
  display: flex;
  align-items: center;
  opacity: 0.4;
  padding: 0.125rem;

  input, label {
    cursor: pointer;
  }

  &-active {
    opacity: 1;
  }

  &-icon {
    margin: 0 0.25rem;
  }
}
</style>
