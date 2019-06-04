<template>
  <div class="container">
    <b-table
    :items="matches"
    :fields="matchFields"
    :busy="isBusy"
    striped small bordered caption-top>
    <div slot="table-busy" class="text-center text-danger my-2">
        <b-spinner class="align-middle" />
        <strong>Loading...</strong>
    </div>
    <template slot="match" slot-scope="data">
      <b-button variant="link" v-b-toggle=data.value >{{data.value}}</b-button>
      <b-collapse :id=data.value class="mt-2">
        <b-table
          :items="data.item.players"
          :fields="playerFields"
          striped fixed small bordered caption-top>
        </b-table>
      </b-collapse>
    </template>
    </b-table>
  </div>
</template>

<script>
import { API } from "aws-amplify";

export default{
  name:"MatchPoints",
  data(){
    return{
      isBusy:true,
      matches:[],
      playerFields:[
        {key:'name',sortable:true},
        {key:"batting",sortable:true},
        {key:"bowling",sortable:true},
        {key:"fielding",sortable:true},
        {key:"mom",sortable:true},
        {key:"total",sortable:true}
      ],
      matchFields:[
        {key:"#"},
        {key:"match"}
      ]
    }
  },
  methods: {
    matchCompare(a,b) {
      if(a['#']>b['#']) return -1;
      if(a['#']<b['#']) return 1;
      return 0;
    }
  },
  mounted() {
    //do something after mounting vue instance
    API.get('usersApi',"/matchpoints/").then(response =>{
      if(response.length!=0)
      {
        this.matches=[];
        let reg=/[a-z]+-vs-[a-z]+-match-(\d+)+/;
        for(var i=0;i<response.length;i++)
        {
          var match = {};
          var matchString = response[i].match;
          match["#"]=parseInt(matchString.match(reg)[1]);
          match["match"]=response[i].match;
          match["players"]=[];
          for(const key in response[i].points)
          {
            var points=response[i].points[key];
            match["players"].push({
              "name":key,
              "batting":points.totalbat,
              "bowling":points.totalbowl,
              "fielding":points.totalfield,
              "mom":points.mom,
              "total":points.totalpoints
            });
          }
          this.matches.push(match);
        }
        this.matches.sort(this.matchCompare);
        this.isBusy=false;
      }
    });
  }
}
</script>
