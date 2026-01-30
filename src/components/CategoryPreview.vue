<template>
  <div
    v-tooltip.left="{
      content: category.details,
      triggers: ['hover', 'click'],
      html: true,
    }"
    :class="['category-preview', {'category-preview-active': category.active}]"
    :style="styles"
  >
    <input
      :id="`chk-category-${category.id}`"
      v-model="category.active"
      type="checkbox"
    >
    <label :for="`chk-category-${category.id}`">{{ category.description }}</label>
  </div>
</template>

<script>
export default {
  name: 'CategoryPreview',
  props: {
    category: Object,
  },
  computed: {
    styles() {
      return {
        color: this.category.color,
        fontStyle: this.category.style,
      };
    },
  },
  watch: {
    'category.active': function handle(active) {
      this.$emit('update-route', { id: this.category.id, active });
    },
    $route(to) {
      if (to.query.categories === 'all' || to.query.categories === 'none') {
        this.category.active = to.query.categories === 'all';
      } else if (to.query[`categories.${this.category.id}`] !== undefined) {
        this.category.active = to.query[`categories.${this.category.id}`] === 'true';
      }
    },
  },
};
</script>

<style lang="scss">
.category-preview {
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
}
</style>
