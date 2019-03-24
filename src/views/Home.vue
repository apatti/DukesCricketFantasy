<template>
  <div class=".container">
    <div class="text-center" style="margin-bottom:0">
      <h1 class="display-8">Welcome {{Name}}</h1>
      <div>
        <router-link  :to="{ name: 'teamsetup', params: { username: Name}}">Team Setup</router-link>
      </div>
      <!--<router-link v-if="!newTeam" :to="{ name: 'team', params: { username: Name}}">View Team</router-link>-->
    </div>
    <!--<Navbar/>-->
  </div>
</template>

<script>

  //import Navbar from './Navbar.vue'
  import { Auth } from "aws-amplify";
  export default {
    name: "Home",
    components: {
      //Navbar
    },
    data(){
      return {
        Name:null,
        newTeam:false
      };
    },
    mounted() {
      Auth.currentAuthenticatedUser().then(user=>{
        this.Name=user.username;
        localStorage.setItem("username",this.Name);
      });

    }
  }
</script>
