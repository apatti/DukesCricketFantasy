<template>
  <div class=".container">
    <div class="text-center" style="margin-bottom:0">
      <h1 class="display-8">Welcome {{Name}}</h1>
      <div>
        <router-link  :to="{ name: 'teamsetup', params: { username: Name}}">Team Setup</router-link>
      </div>
      <!--<router-link v-if="!newTeam" :to="{ name: 'team', params: { username: Name}}">View Team</router-link>-->
    </div>
    <div>
      <p><strong>Player Trends</strong></p>
      <b-table
      :items="players"
      :fields="playerFields"
      :busy="isBusy"
      striped small fixed bordered caption-top>
      <div slot="table-busy" class="text-center text-danger my-2">
          <b-spinner class="align-middle" />
          <strong>Loading...</strong>
      </div>
      <template slot="own %" slot-scope="data">
        {{ data.value.toFixed() }}%
      </template>
      </b-table>
    </div>

    <!--<Navbar/>-->
  </div>
</template>

<script>

  import { API } from "aws-amplify";
  //import Navbar from './Navbar.vue'
  import { Auth } from "aws-amplify";
  export default {
    name: "Home",
    components: {
      //Navbar
    },
    data(){
      return {
        isBusy:true,
        players:[],
        playerFields:[
          {key:"name",sortable:true},
          {key:"own %",sortable:true}
        ],
        Name:null,
        newTeam:false
      };
    },
    methods: {
      compare(a,b) {
        if(a["own %"]>b["own %"]) return -1;
        if(a["own %"]<b["own %"]) return 1;
        return 0;
      }
    },
    mounted() {
      Auth.currentAuthenticatedUser().then(user=>{
        this.Name=user.username;
        localStorage.setItem("username",this.Name);
      });
      API.get('usersApi',"/teamcomposition/").then(response =>{
        if(response.length!=0)
        {
          this.isBusy=false;
          for(var player in response)
          {
            this.players.push({"name":player,"own %":response[player]});
          }
          this.players.sort(this.compare);
        }
      });
    }
  }
</script>
