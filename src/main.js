
import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'
import VueRouter from 'vue-router'
import App from './App.vue'

import Amplify from 'aws-amplify';
import aws_exports from './aws-exports';
Amplify.configure(aws_exports);

Vue.config.productionTip = true
Vue.use(VueRouter)
Vue.use(BootstrapVue)

import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import router from './router'

new Vue({
  render: h => h(App),
  router
}).$mount('#app')
