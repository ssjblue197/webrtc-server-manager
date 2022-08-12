import Vue from 'vue'
import App from './App.vue'

import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

// Import Bootstrap an BootstrapVue CSS files (order is important)
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import VueBootstrapToasts from "vue-bootstrap-toasts";
import MarqueeText from 'vue-marquee-text-component'

Vue.component('marquee-text', MarqueeText)

import VModal from 'vue-js-modal'
Vue.use(VueBootstrapToasts);
// Make BootstrapVue available throughout your project
Vue.use(BootstrapVue)
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin)
Vue.use(VModal)
Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
