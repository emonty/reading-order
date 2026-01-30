<template>
  <details
    class="layer"
    :open="layer.startCollapsed !== true"
  >
    <summary>
      <span class="layer__header">
        {{ layer.name }}
        <EyeIcon
          v-if="layer.active"
          class="layer-toggle"
          @click.prevent.stop
        />
        <EyeOffIcon
          v-else
          class="layer-toggle"
          @click.prevent.stop="activate"
        />
      </span>
    </summary>
    <CategoryPreview
      v-for="category in layer.categories"
      :key="category.id"
      :category="category"
      @update-route="$emit('update-category-route', $event)"
    />
  </details>
</template>

<script>
import { Eye, EyeOff } from 'lucide-vue-next';
import CategoryPreview from '@/components/CategoryPreview.vue';

export default {
  name: 'Layer',
  components: { CategoryPreview, EyeIcon: Eye, EyeOffIcon: EyeOff },
  props: {
    layer: Object,
  },
  watch: {
    $route(to) {
      this.layer.active = to.query.layer === this.layer.id
        || (to.query.layer === undefined && this.layer.startActive);
    },
  },
  methods: {
    activate() {
      this.$router.replace({ query: { ...this.$route.query, layer: this.layer.id } });
    },
  },
};
</script>

<style lang="scss">
.layer {
  display: flex;
  flex-direction: column;
  align-items: flex-start !important;
  padding-left: 0.5rem;

  summary {
    box-sizing: border-box;
    padding: 0.25rem 0;
    font-weight: bold;
    outline: none;
    cursor: pointer;
    margin: 0 0 0 -0.5rem;
  }

  &__header {
    display: inline-flex;
    align-items: center;
    width: calc(100% - 1.5rem);
  }

  &-toggle {
    margin-left: auto;

    &:hover, &:focus {
      color: #b4b4b4;
    }
  }
}
</style>
