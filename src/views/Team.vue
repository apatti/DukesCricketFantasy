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
  <div>
    <b-button variant="success" v-b-toggle.collapse1 >{{pointsCollapseText}}</b-button>
    <b-collapse id="collapse1" visible class="mt-2">
      <b-table
        :items="matchPoints"
        :fields="pointsFields"
        striped small bordered caption-top>
      </b-table>
    </b-collapse>
  </div>
  </div>
</template>

<script>
  import { API } from "aws-amplify";
  export default{
    name: "Team",
    data(){
      return{
        pointsCollapseText:"Hide Points History",
        matchPoints:[],
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
        ],
        pointsFields:[
          {key:"#",sortable:true},
          {key:'match',sortable:true},
          {key:'batting',sortable:true},
          {key:'bowling',sortable:true},
          {key:'fielding',sortable:true},
          {key:'mom',sortable:true},
          {key:'captain',sortable:true},
          {key:'vice-captain',sortable:true},
          {key:'total',sortable:true}
        ]
      }
    },
    created() {
      //do something after creating vue instance
      this.username=this.$route.params.username;
    },
    mounted() {
      this.$root.$on('bv::collapse::state', (collapseId, isJustShown) => {
        if(!isJustShown)
        {
          this.pointsCollapseText="Show Points History";
        }
        else {
          this.pointsCollapseText="Hide Points History";
        }

      });
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
          this.points=teamRecord.points;
          this.localtime=teamRecord.localtime;
          for(var i=0;i<this.team.length;i++)
          {
            this.budget+=this.team[i].salary;
          }
        }
      });
      API.get('usersApi',"/usermatchpoints/"+this.username).then(response =>{
        if(response.length!=0)
        {
          this.matchPoints=[];
          for(var i=0;i<response.length;i++)
          {
            this.matchPoints.push({
                "#":i+1,
                "match":response[i].match,
                "batting":response[i].points.batPoints,
                "bowling":response[i].points.bowlPoints,
                "fielding":response[i].points.fieldPoints,
                "mom":response[i].points.momPoints,
                "total":response[i].points.totalPoints,
                "captain":response[i].points.capPoints,
                "vice-captain":response[i].points.vcPoints
            });
          }
        }
      });
    }
  }

</script>
