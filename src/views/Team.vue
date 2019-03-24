<template>
  <div class="container">
    <div>
      <p class="display-4">{{teamName}}</p>
    </div>
    <b-table
    :items="team"
    :fields="teamFields"
    striped fixed small bordered caption-top>
      <template slot="table-caption">
        <strong>Budget:${{budget}}<br/>
          <p >Salary Utilization
            <b-progress class="mt-2" :max=100 :value="(budget/1000000)*100" show-value variant="info"/>
          </p>
          Subs:{{subs}}<br/>
          Points: {{points}}<br/>
          Rank: TBD <br/>
          Captain:{{c}}<br/>
          Vice-Captain:{{vc}} <br/>
          Last update: {{localtime}}
      </strong>
    </template>
  </b-table>
  </div>
</template>

<script>
  import { API } from "aws-amplify";
  export default{
    name: "Team",
    data(){
      return{
        username:"",
        teamName:"",
        team:null,
        subs:0,
        points:0,
        budget:0,
        localtime:"",
        c:"",
        vc:"",
        teamFields: [
          {key:'name',sortable:true},
          {key:'team',sortable:true},
          {key:'category',sortable:true},
          {key:'salary',sortable:true}
        ]
      }
    },
    created() {
      //do something after creating vue instance
      this.username=this.$route.params.username;
    },
    mounted() {
      //do something after mounting vue instance
      //let username = this.$route.params.username;
      API.get('usersApi',"/lockedteams/"+this.username).then(response =>{
        if(response.length!=0)
        {
          var teamRecord  = response[response.length-1];
          this.teamName = teamRecord.teamName;
          this.team = teamRecord.team;
          this.subs = teamRecord.subs;
          this.c=teamRecord.c;
          this.vc=teamRecord.vc;
          this.localtime=teamRecord.localtime;
          for(var i=0;i<this.team.length;i++)
          {
            this.budget+=this.team[i].salary;
          }
        }
      });
    }
  }

</script>
