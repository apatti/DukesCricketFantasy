import * as AmplifyModules from "aws-amplify";
import { AmplifyPlugin,components, AmplifyEventBus } from "aws-amplify-vue";
import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
Vue.use(AmplifyPlugin, AmplifyModules);
Vue.use(Router)

let user;

getUser().then((user) => {
  if (user) {
    router.push({path: '/'})
  }
})

AmplifyEventBus.$on('authState', async (state) => {
  if (state === 'signedOut'){
    user = null;
    localStorage.setItem('UserAuthenticated', false);
    //AmplifyStore.commit('User', null);
    router.push({path: '/auth'})
  } else if (state === 'signedIn') {
    user = await getUser();
    router.push({path: '/'})
  }
});

function getUser() {
  return Vue.prototype.$Amplify.Auth.currentAuthenticatedUser().then((data) => {
    if (data && data.signInUserSession) {
      //AmplifyStore.commit('User', data);
      localStorage.setItem('UserAuthenticated', true);
      return data;
    }
  }).catch(() => {
    //AmplifyStore.commit('User', null);
    localStorage.setItem('UserAuthenticated', false);
    return null
  });
}

const router = new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: { requiresAuth: true}
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './views/About.vue')
    },
    {
      path: '/standings',
      name: 'standings',
      component: () => import(/* webpackChunkName: "about" */ './views/Standings.vue'),
      meta: {requiresAuth: true}
    },
    {
      path: '/teamsetup',
      name: 'teamsetup',
      component: () => import(/* webpackChunkName: "about" */ './views/TeamSetup.vue'),
      meta: {requiresAuth: true}
    },
    {
      path: '/rules',
      name: 'rules',
      component: () => import(/* webpackChunkName: "about" */ './views/Rules.vue')
    },
    {
      path: '/players',
      name: 'players',
      component: () => import(/* webpackChunkName: "about" */ './views/Players.vue')
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: () => import(/* webpackChunkName: "about" */ './views/Schedule.vue')
    },
    {
      path: '/managers',
      name: 'managers',
      component: () => import(/* webpackChunkName: "about" */ './views/Managers.vue'),
      meta: {requiresAuth: true}
    },
    {
      path: '/team',
      name: 'team',
      component: () => import(/* webpackChunkName: "about" */ './views/Team.vue'),
      meta: {requiresAuth: true}
    },
    {
      path: '/livepoints',
      name: 'livepoints',
      component: () => import(/* webpackChunkName: "about" */ './views/LivePoints.vue'),
      meta: {requiresAuth: true}
    },
    {
      path: '/matchpoints',
      name: 'matchpoints',
      component: () => import(/* webpackChunkName: "about" */ './views/MatchPoints.vue'),
      meta: {requiresAuth: true}
    },
    {
      path: '/allteams',
      name: 'allteams',
      component: () => import(/* webpackChunkName: "about" */ './views/AllTeams.vue'),
      meta: {requiresAuth: true}
    },
    {
      path: '/transfers',
      name: 'transfers',
      component: () => import(/* webpackChunkName: "about" */ './views/Transfers.vue'),
      meta: {requiresAuth: true}
    },
    {
      path: '/transferresults',
      name: 'transferresults',
      component: () => import(/* webpackChunkName: "about" */ './views/TransferResults.vue'),
      meta: {requiresAuth: true}
    },
    {
      path: '/auth',
      name: 'Authenticator',
      component: components.Authenticator
    }
  ]
});

router.beforeResolve(async (to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    user = await getUser();
    if (!user) {
      return next({
        path: '/auth',
        query: {
          redirect: to.fullPath,
        }
      });
    }
    return next()
  }
  return next()
})

export default router
