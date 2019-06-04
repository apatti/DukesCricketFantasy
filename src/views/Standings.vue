<template>
  <div class="container">
    <strong> Regular Phase </strong>
    <b-table
    :items="users"
    :fields="teamFields"
    :busy="isBusy"
    striped small bordered caption-top>
    <div slot="table-busy" class="text-center text-danger my-2">
        <b-spinner class="align-middle" />
        <strong>Loading...</strong>
      </div>
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
        isBusy:true,
        dummies:[
          "test"
        ],
        teamFields: [
          {key:'rank',sortable:true},
          {key:'team',sortable:true},
          {key:'manager',sortable:true},
          {key:'points',sortable:true},
          {key:'phase',sortable:true},
          {key:'match',sortable:true},
          {key:'subs',sortable:true}
        ]
      }
    },
    methods: {
      rankCompare(a,b) {
        if(a.points>b.points) return -1;
        if(a.points<b.points) return 1;
        if(a.points==b.points)
        {
          if(a.phase>b.phase) return -1;
          if(a.phase<b.phase) return 1;
        }
        if(a.phase==b.phase)
        {
          if(a.subs>b.subs) return -1;
          if(a.subs<b.subs) return 1;
        }
        return 0;
      },
      phaseRankCompare(a,b) {
        if(a.phase>b.phase) return -1;
        if(a.phase<b.phase) return 1;
        if(a.phase==b.phase)
        {
          if(a.match>b.match) return -1;
          if(a.match<b.match) return 1;
        }
        if(a.match==b.match)
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
          var userPointMap = {};
          for(var l=0;l<response.length;l++)
          {
            var userRecord = response[l];
            //alert(userRecord.teamName);
            if(!this.dummies.includes(userRecord.teamName))
            {
              this.users.push({
                "team":userRecord.teamName,
                "manager":userRecord.username,
                "points":userRecord.points,
                "subs":userRecord.subs,
                "phase":userRecord.phase,
                "match":userRecord.matchpoints
              });
            }
            userPointMap[userRecord.teamName]={"points":userRecord.points,"phase":userRecord.phase,"match":userRecord.matchpoints,"subs":userRecord.subs};
          }
          this.users.sort(this.rankCompare);
          for(var j=0;j<this.users.length;j++)
          {
            this.users[j]["rank"]=j+1;
          }
          this.isBusy=false;
        }
      });
    }
  }
</script>
