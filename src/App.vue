<template>
  <div id="app">
    <!--<DukesHeader/>-->
    <Navbar/>
    <router-view/>
  </div>
</template>

<script>
  import Navbar from './components/Navbar.vue'
  //import DukesHeader from './components/DukesHeader.vue'
  export default {
    components: {
      Navbar,
      //DukesHeader
    }
  }
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 10px;
}
</style>
