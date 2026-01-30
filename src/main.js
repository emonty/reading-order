import { createApp } from 'vue';
import { createPinia } from 'pinia';
import FloatingVue from 'floating-vue';
import 'floating-vue/dist/style.css';
import App from './App.vue';
import router from './router';
import { closableDirective } from './custom-directives';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(FloatingVue);
app.directive('closable', closableDirective);

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
});

app.mount('#app');
