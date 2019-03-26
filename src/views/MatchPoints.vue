<template>
  <div class="container">
    <b-table
    :items="matches"
    :fields="matchFields"
    striped small bordered caption-top>
    <template slot="#" slot-scope="data">
      {{ data.index + 1 }}
    </template>
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
  mounted() {
    //do something after mounting vue instance
    API.get('usersApi',"/matchpoints/").then(response =>{
      if(response.length!=0)
      {
        this.matches=[];
        for(var i=0;i<response.length;i++)
        {
          var match = {};
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
      }
    });
  }
}
</script>
