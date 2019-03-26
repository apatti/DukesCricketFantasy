<template>
  <div class="container">
    <b-table
    :items="users"
    :fields="teamFields"
    striped small bordered caption-top>
    <template slot="rank" slot-scope="data">
      {{ data.index + 1 }}
    </template>
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
          {key:'rank'},
          {key:'team'},
          {key:'manager'},
          {key:'points'},
          {key:'subs'}
        ]
      }
    },
    methods: {
      rankCompare(a,b) {
        if(a.points>b.points) return -1;
        if(a.points<b.points) return 1;
        if(a.points==b.points)
        {
          if(a.subs>b.subs) return -1;
          if(a.subs<b.subs) return 1;
        }
        return 0;
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
          this.users.sort(this.rankCompare);
        }
      });
    }
  }
</script>
