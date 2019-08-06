<template>
  <div class="container">
    <strong> Money Phase </strong>
    <div>
    <strong> Top Tier </strong>
      <b-table
      :items="usersTT"
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
    <div>
    <strong> Bottom Tier </strong>
      <b-table
      :items="usersBT"
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
  </div>
</template>

<script>
  import { API } from "aws-amplify";

  export default{
    name:"Standings",
    data(){
      return{
        users:null,
        usersTT: null,
        usersBT: null,
        isBusy:true,
        dummies:[
          "test"
        ],
        topTier:[
          "RamsPats","mailsrujan","raghukishore","rprativadi",
          "sabarishv","sagar1221","thotakuri","NareshBalija"
        ],
        bottomTier:[
          "Caribbeankings","Chandu","Sreedhar","pakkapeddi",
          "sagartummala","vijaym","ngkiran43", "KalaXI"
        ],
        teamFields: [
          {key:'rank',sortable:true},
          {key:'team',sortable:true},
          {key:'manager',sortable:true},
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
          //this.users=[];
          this.usersBT=[];
          this.usersTT=[];
          var userPointMap = {};
          for(var l=0;l<response.length;l++)
          {
            var userRecord = response[l];
            //alert(userRecord.teamName);
            if(!this.dummies.includes(userRecord.teamName))
            {
              /*
              this.users.push({
                "team":userRecord.teamName,
                "manager":userRecord.username,
                "points":userRecord.points,
                "subs":userRecord.subs,
                "phase":userRecord.phase,
                "match":userRecord.matchpoints
              });*/
              if(this.topTier.includes(userRecord.teamName))
              {
                this.usersTT.push({
                  "team":userRecord.teamName,
                  "manager":userRecord.username,
                  "points":userRecord.points,
                  "subs":userRecord.subs,
                  "phase":userRecord.phase,
                  "match":userRecord.matchpoints
                });
              }
              else {
                this.usersBT.push({
                  "team":userRecord.teamName,
                  "manager":userRecord.username,
                  "points":userRecord.points,
                  "subs":userRecord.subs,
                  "phase":userRecord.phase,
                  "match":userRecord.matchpoints
                });
              }
            }
            userPointMap[userRecord.teamName]={"points":userRecord.points,"phase":userRecord.phase,"match":userRecord.matchpoints,"subs":userRecord.subs};
          }
          //this.users.sort(this.rankCompare);
          this.usersTT.sort(this.phaseRankCompare);
          this.usersBT.sort(this.phaseRankCompare);
          for(var j=0;j<this.usersTT.length;j++)
          {
            this.usersTT[j]["rank"]=j+1;
            this.usersBT[j]["rank"]=j+1;
          }
          this.isBusy=false;
        }
      });
    }
  }
</script>
