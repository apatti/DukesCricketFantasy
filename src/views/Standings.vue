<template>
  <div class="container">
    <b-table
    :items="users"
    :fields="teamFields"
    striped fixed small bordered caption-top>
    <template slot="team" slot-scope="data">
      <router-link  :to="{ name: 'team', params: { username: data.item.manager}}">{{data.value}}</router-link>
    </template>
    </b-table>
  </div>
</template>

<script>
  import { API } from "aws-amplify";

  export default{
    name:"Standings",
    data(){
      return{
        users:null,
        teamFields: [
          {key:'team',sortable:true},
          {key:'manager',sortable:true},
          {key:'points',sortable:true},
          {key:'subs',sortable:true}
        ]
      }
    },
    mounted() {
      //do something after mounting vue instance
      API.get('usersApi',"/lockedteams/").then(response =>{
        if(response.length!=0)
        {
          this.users=[];
          for(var i=0;i<response.length;i++)
          {
            var userRecord = response[i];
            this.users.push({
              "team":userRecord.teamName,
              "manager":userRecord.username,
              "points":userRecord.points,
              "subs":userRecord.subs
            });
          }
        }
      });
    }
  }
</script>
