<template>
  <div class="container">
    <b-table
    :items="points"
    :fields="pointsFields"
    :busy="isBusy"
    striped small bordered caption-top>
    <template slot="table-caption">
      Last Update:{{lastUpdate}}<br/>
    </template>
    <div slot="table-busy" class="text-center text-danger my-2">
        <b-spinner class="align-middle" />
        <strong>Loading...</strong>
    </div>
    </b-table>
  </div>
</template>

<script>
import { API } from "aws-amplify";

export default{
  name:"LivePoints",
  data(){
    return{
      isBusy:true,
      lastUpdate:"",
      points:[],
      pointsFields:[
        {key:'name',sortable:true},
        {key:"total",sortable:true}
      ]
    }
  },
  mounted() {
    API.get('usersApi',"/livepts/").then(response =>{
      if(response.length!=0)
      {
        this.points=[];
        this.pointsFields.push({key:'name',sortable:true});
        this.pointsFields.push({key:'total',sortable:true});
        var players = [];

        for(var i=0;i<response.length;i++)
        {
          var userPt={}
          var timestamp = new Date(response[i].timestamp*1000);
          //var minutes = "0"+timestamp.getMinutes();
          //var seconds = "0"+timestamp.getSeconds();
          this.lastUpdate = timestamp;
          userPt["name"]=response[i].username;
          userPt["total"]=response[i].totalpoints;
          var teamPoints = response[i].teamPoints;
          for(var j=0;j<teamPoints.length;j++)
          {
            let playerName = teamPoints[j].split(' - ')[0];
            let score = teamPoints[j].split(' - ')[1];
            if(!players.includes(playerName))
            {
              this.pointsFields.push({key:playerName,sortable:true});
              players.push(playerName)
            }
            userPt[playerName]=score
          }
          this.points.push(userPt);
        }

        this.isBusy=false;
      }
    });
  }
}
</script>
