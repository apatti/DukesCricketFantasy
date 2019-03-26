<template>
  <div>
    <b-navbar toggleable="lg" type="light" variant="light">
      <b-navbar-brand href="#">Dukes IPL Fantasy</b-navbar-brand>
      <b-navbar-toggle target="nav_collapse" />
      <b-collapse is-nav id="nav_collapse">
        <b-navbar-nav>
          <b-nav-item to="/">Home</b-nav-item>
          <b-nav-item to="standings">Standings</b-nav-item>
          <b-nav-item to="players">Players</b-nav-item>
          <b-nav-item to="schedule">Schedule</b-nav-item>
          <b-nav-item to="managers">Team Managers</b-nav-item>
          <b-nav-item to="matchpoints">Match Points</b-nav-item>
          <b-nav-item to="rules">Rules</b-nav-item>
          <b-nav-item to="about">About</b-nav-item>
        </b-navbar-nav>
        <b-navbar-nav class="ml-auto">
          <amplify-sign-out v-if="user"></amplify-sign-out>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>

<script>
  export default {
    name: "Navbar",
    data(){
      return{}
      },
    computed: {
      user: function() {
        //alert(localStorage.UserAuthenticated.toLowerCase());
        return localStorage.UserAuthenticated.toLowerCase()==='true'?true:false;
      }
    }
  }
</script>
