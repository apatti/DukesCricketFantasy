<template>
  <div class="container">
    <b-row >
      <b-col v-for="userTeam in userTeams">
        <b-table
        :items="userTeam.team"
        :fields="teamFields"
        striped small bordered caption-top>
          <template slot="table-caption">
            <strong>Name:{{userTeam.name}}<br/>
              Captain:{{userTeam.c}}<br/>
              Vice-Captain:{{userTeam.vc}} <br/>
              Last update: {{userTeam.localtime}}
          </strong>
        </template>
        </b-table>
      </b-col>
    </b-row>
  </div>
</template>
<script>
import { API } from "aws-amplify";

export default{
  name:"AllTeams",
  data(){
    return{
      userTeams:[],
      teamFields: [
        {key:'name',sortable:true},
        {key:'team',sortable:true}
      ],
    }
  },
  mounted() {
    //do something after mounting vue instance
    API.get('usersApi',"/lockedteams/").then(response =>{
      if(response.length!=0)
      {
        this.userTeams=[];
        for(var l=0;l<response.length;l++)
        {
          var userTeam = response[l];
          this.userTeams.push({
            "name":userTeam.teamName,
            "manager":userTeam.username,
            "c":userTeam.c,
            "vc":userTeam.vc,
            "team":userTeam.team,
            "localtime":userTeam.localtime
          });
        }
      }
    });
  }
}
</script>
