<template>
  <div class="container">
    <div>
      <b-form @submit="onSubmit" @reset="onReset">
        <b-form-group
        id="teamNameInputGroup1"
        label="Team Name:"
        label-for="teamName"
        v-if="isNewteam"
        >
          <b-form-input
            id="teamName"
            v-model="form.teamName"
            required
            :state="validation"
            placeholder="Please choose wisely, name changes are not allowed" />
            <b-form-invalid-feedback :state="validation">
              TeamName cannot be empty.
            </b-form-invalid-feedback>
            <b-form-valid-feedback :state="validation">
              Please choose wisely, team name changes are not allowed
            </b-form-valid-feedback>
        </b-form-group>
        <div v-if="!isNewteam"><strong>Team Name: {{form.teamName}} </strong></div>
          <b-table
          selectable
          selectedVariant="danger"
          :items="form.team"
          :fields="teamFields"
          @row-selected="droppedListSelected"
          stripped fixed small bordered caption-top>
            <template slot="table-caption"><strong>Budget:${{budget}}/{{1000000}}<br/>
              Remaining:${{1000000-budget}}<br/>
              <p >Salary Utilization
                <b-progress class="mt-2" :max=100 :value="(budget/1000000)*100" show-value variant="info"/>
              </p>
              Subs:{{subs}}
              </strong>
            </template>
          </b-table>
          <div class="row justify-content-center align-items-center">
            <b-button variant="success" class="ml-1" v-b-toggle.collapse1 @click="onPlayerAdd" >Add</b-button>
            <b-button variant="danger" class="ml-1" v-b-toggle.collapse1 @click="onPlayerRemove">Remove</b-button>
          </div>
          <div>
            <b-button v-b-toggle.collapse1 class="mb-2" variant="info">Show Players</b-button>
            <b-collapse id="collapse1" class="mt-2">
              <b-form-input v-model="filter" placeholder="Type to Search" />
              <b-table
              selectable
              selectedVariant="success"
              :items="players"
              :fields="playerFields"
              :filter="filter"
              @row-selected="addListSelected"
              stripped fixed small bordered
              show-empty
              />
            </b-collapse>
          </div>
          <div>
            <b-form-group
              id="teamcaptainselectGroup1"
              label="Captain:"
              label-for="captainselect"
            >
              <b-form-select id="captainselect" v-model="form.c">
                <template slot="first">
                  <option :value="null" disabled>-- Please select the captain --</option>
                </template>
                <option v-for="index in form.team.length" :key="index" :value="form.team[index-1].name">
                  {{form.team[index-1].name + " ("+form.team[index-1].team+")"}}
                </option>
              </b-form-select>

            </b-form-group>
            <b-form-group
              id="teamviceCaptainselectGroup1"
              label="Vice Captain:"
              label-for="vicecaptainselect"
              >
              <b-form-select id="vicecaptainselect" v-model="form.vc">
                <template slot="first">
                  <option :value="null" disabled>-- Please select the vice-captain --</option>
                </template>
                <option v-for="index in form.team.length" :key="index" :value="form.team[index-1].name">
                  {{form.team[index-1].name + " ("+form.team[index-1].team+")"}}
                </option>
              </b-form-select>

            </b-form-group>
          </div>
          <div>
            <b-button type="submit" variant="primary" class="ml-1">Submit</b-button>
            <b-button type="reset" variant="danger" class="ml-1">Reset</b-button>
            <b-modal id="modal1" title="Team Submission Error" ref="myModalRef">
                <p class="my-4">{{teamSubmissionErrorText}}</p>
            </b-modal>
            <b-modal id="modal2" title="Team successfully added!!" ref="teamChangesModalRef">
                <p class="my-4">{{changeText}}</p>
            </b-modal>
          </div>
      </b-form>
    </div>
  </div>
</template>

<script>
  import { API } from "aws-amplify";
  import router from '../router';
  export default{
    name: "TeamSetup",
    data(){
      return {
        budget:0,
        subs:120,
        lockedTeam:null,
        filter:"",
        currentRecord:null,
        cachePlayers:null,
        changeText:"",
        form:{
          teamName:"",
          team:[],
          bat:[],
          bowl:[],
          ar:[],
          wk:[],
          filler:[],
          c:"",
          vc:""
        },
        isNewteam:false,
        players:[],
        playerFields:[
          {key:'name',sortable:true},
          {key:'team',sortable:true},
          {key:'category',sortable:true},
          {key:'salary',sortable:true}
        ],
        teamFields: [
          {key:'name',sortable:true},
          {key:'team',sortable:true},
          {key:'category',sortable:true},
          {key:'salary',sortable:true}
        ],
        playersToAdd:[],
        playersToDrop:[],
        budgetExceeded:false,
        teamSubmissionErrorText:""
      }
    },
    computed:{
      validation() {
        return this.form.teamName.length >0;
      }
    },
    methods: {
      getChanges(){
        var changes={};
        if(this.currentRecord==null)
        {
          changes["new_c"]=this.form.c;
          changes["new_vc"]=this.form.vc;
          changes["addtions"]=this.form.team;
          return;
        }
        if(this.currentRecord.c!=null&this.currentRecord.c!=this.form.c)
        {
          changes["new_c"]=this.form.c;
          changes["old_c"]=this.currentRecord.c;
        }
        if(this.currentRecord.vc!=null&this.currentRecord.vc!=this.form.vc)
        {
          changes["new_vc"]=this.form.vc;
          changes["old_vc"]=this.currentRecord.vc;
        }
        changes["additions"] = this.form.team.filter(function(player){
          return this.currentRecord.team.map(function(e) { return e.name; }).indexOf(player.name) ===-1;
        },this).map(function(e){return e.name+" ("+e.category+")"});
        changes["subtractions"] = this.currentRecord.team.filter(function(player){
          return this.form.team.map(function(e) { return e.name; }).indexOf(player.name) ===-1;
        },this).map(function(e){return e.name+" ("+e.category+")"});
        //alert(JSON.stringify(changes));
        //changes["additions"].join("<br/>");
        //return changes["additions"].join("<br/>");
        return changes;
      },
      getSubCount(){
        return this.form.team.filter(function(player){
          return this.lockedTeam.team.map(function(e) { return e.name; }).indexOf(player.name) ===-1;
        },this).length;
      },
      jsonCopy(src) {
        return JSON.parse(JSON.stringify(src));
      },
      onSubmit(evt) {
        evt.preventDefault();
        var username =localStorage.getItem("username");
        var teamBudget = this.calculateBudget();
        var newSubCount=this.lockedTeam.subs-this.getSubCount();
        if(newSubCount<0)
        {
          this.teamSubmissionErrorText="No more lives (subs) for you :) !!!";
          this.$refs.myModalRef.show();
          return;
        }
        if(this.form.team.length!=11)
        {
          this.teamSubmissionErrorText="You need to have 11 players in team!!!";
          this.$refs.myModalRef.show();
          return;
        }
        if(teamBudget>1000000)
        {
          this.teamSubmissionErrorText="Team budget exceeded!!!";
          this.budgetExceeded=true;
          this.$refs.myModalRef.show();
          return;
        }
        else {
          this.budgetExceeded=false;
        }
        this.teamSubmissionErrorText="";
        var changes = this.getChanges();

        var date = new Date();
        var timestamp = Math.floor(date.getTime()/1000);
        var dateString = date.toUTCString();
        API.post('usersApi',"/userteams/",{body:{
          "username":username,
          "timestamp":timestamp,
          "utctime":dateString,
          "localtime":date.toString(),
          "league":"dukes",
          "teamName":this.form.teamName,
          "team":this.form.team,
          "c":this.form.c,
          "vc":this.form.vc,
          "subs":newSubCount,
          "points":0,
          "bat":this.form.bat,
          "bowl":this.form.bowl,
          "ar":this.form.ar,
          "wk":this.form.wk,
          "filler":this.form.filler
        }}).then(response=>{
          if(response)
          {
            //this.changeText=changes;
            //this.$refs.teamChangesModalRef.show();
            alert("Team successfully added!!");
            alert(JSON.stringify(changes));
            router.push({ name: "home" });
          }
          else {
            alert(JSON.stringify(response));
          }
        });
      },
      addListSelected(items){
        this.playersToAdd=items;
      },
      droppedListSelected(items){
        this.playersToDrop=items;
      },
      getCategoryCount(team){
        var catCount={"Bat":3,"Bowl":3,"WK":1,"AR":2,"f":2}
        for(var i=0;i<team.length;i++)
        {
          catCount[team[i].category]--;
        }
        if(catCount.Bat<0)
        {
          catCount.f += catCount.Bat;
          catCount.Bat=0
        }
        if(catCount.Bowl<0)
        {
          catCount.f += catCount.Bowl;
          catCount.Bowl=0
        }
        if(catCount.AR<0)
        {
          catCount.f += catCount.AR;
          catCount.AR=0
        }
        if(catCount.WK<0)
        {
          catCount.f += catCount.WK;
          catCount.WK=0
        }
        return catCount;
      },
      onReset(evt) {
        evt.preventDefault()
        this.budgetExceeded=false;
        this.players=this.cachePlayers;
        if(this.currentRecord===null)
        {
          this.form.teamName="";
          this.form.bat=[];
          this.form.bowl=[];
          this.form.ar=[];
          this.form.wk=[];
          this.form.filler=[];
          this.form.c="";
          this.form.vc="";
          this.form.team=[];
        }
        else {
          var currentRecord = this.jsonCopy(this.currentRecord);
          this.form.teamName=currentRecord.teamName;
          this.form.bat = currentRecord.bat;
          this.form.ar=currentRecord.ar;
          this.form.wk=currentRecord.wk;
          this.form.filler=currentRecord.wk;
          this.form.c = currentRecord.c;
          this.form.vc=currentRecord.vc;
          this.form.team=currentRecord.team;
        }
      },
      onPlayerAdd(evt){
        evt.preventDefault();
        if(this.playersToAdd.length==0)
        {
          return;
        }
        if(this.form.team.length>=11)
        {
          return;
        }
        var catCount = this.getCategoryCount(this.form.team);

        for(var i=0;i<this.playersToAdd.length;i++)
        {
          var player = this.playersToAdd[i];
          if(this.form.team.indexOf(player)>-1)
          {
            continue;
          }
          if(catCount[player.category]>0 || catCount.f>0)
          {
            this.form.team.push(player);
            if(catCount[player.category]>0)
            {
              catCount[player.category]--;
            }
            else {
              catCount.f--;
            }
            continue;
          }
        /*  switch (player.category) {
            case "Bat":
            {
              if(this.form.bat.length>=3 && this.form.filler.length>=2)
              {
                break;
              }
              if(this.form.bat.length<3||this.form.filler.length<2)
              {
                this.form.team.push(player);
                this.players.splice(this.players.map(function(e) { return e.name; }).indexOf(player.name),1);
                if(this.form.bat.length<3)
                {
                  this.form.bat.push(player);
                }
                else if (this.form.filler.length<=2) {
                    this.form.filler.push(player);
                  }
              }
              break;
            }
            case "Bowl":
            {
              if(this.form.bowl.length<3)
              {
                this.form.bowl.push(player);
                this.form.team.push(player);
                this.players.splice(this.players.map(function(e) { return e.name; }).indexOf(player.name),1);
                break;
              }
              if(this.form.filler.length<2)
              {
                this.form.filler.push(player);
                this.form.team.push(player);
                this.players.splice(this.players.map(function(e) { return e.name; }).indexOf(player.name),1);
                break;
              }
              break;
            }
            case "AR":
            {
              if(this.form.ar.length<2)
              {
                this.form.ar.push(player);
                this.form.team.push(player);
                this.players.splice(this.players.map(function(e) { return e.name; }).indexOf(player.name),1);
                break;
              }
              if(this.form.filler.length<2)
              {
                this.form.filler.push(player);
                this.form.team.push(player);
                this.players.splice(this.players.map(function(e) { return e.name; }).indexOf(player.name),1);
                break;
              }
              break;
            }
            case "WK":
            {
              if(this.form.wk.length==0)
              {
                this.form.wk.push(player);
                this.form.team.push(player);
                this.players.splice(this.players.map(function(e) { return e.name; }).indexOf(player.name),1);
                break;
              }
              if(this.form.filler.length<2)
              {
                this.form.filler.push(player);
                this.form.team.push(player);
                this.players.splice(this.players.map(function(e) { return e.name; }).indexOf(player.name),1);
                break;
              }
              break;
            }
            default:

          }
*/
        }
        this.budget = this.calculateBudget();
        this.playersToAdd=[];
      },
      onPlayerRemove(evt){
        evt.preventDefault();
        for(var i=0;i<this.playersToDrop.length;i++)
        {
          var player = this.playersToDrop[i];
          this.form.team.splice(this.form.team.map(function(e) { return e.name; }).indexOf(player.name),1);
          var batindex = this.form.bat.map(function(e) { return e.name; }).indexOf(player.name);
          if(batindex>-1)
          {
            this.form.bat.splice(batindex,1);
          }
          else {
            var bowlindex = this.form.bowl.map(function(e) { return e.name; }).indexOf(player.name);
            if(bowlindex>-1)
            {
              this.form.bowl.splice(bowlindex,1);
            }
            else {
              var arindex = this.form.ar.map(function(e) { return e.name; }).indexOf(player.name);
              if(arindex>-1)
              {
                this.form.ar.splice(arindex,1);
              }
              else {
                var fillerindex = this.form.filler.map(function(e) { return e.name; }).indexOf(player.name);
                if(fillerindex>-1)
                {
                  this.form.filler.splice(fillerindex,1);
                }
              }
            }
          }
          if(this.form.wk.length>0&&player.name==this.form.wk[0].name)
          {
            this.form.wk.pop();
          }
          this.players.push(player);
        }
        this.budget = this.calculateBudget();
        this.playersToDrop=[];
      },
      calculateBudget(){
        var teamBudget=0;
        for(var i=0;i<this.form.team.length;i++)
        {
          teamBudget+=this.form.team[i].salary;
        }
        return teamBudget;
      }
    },
    mounted() {
      //do something after mounting vue instance
      let username = localStorage.getItem("username");

      API.get('usersApi',"/players").then(response=>{
          this.players =response;
          this.cachePlayers=response;
          //alert(JSON.stringify(this.players));
      }).then(response=>{
        API.get('usersApi',"/userteams/"+username).then(response=>{
        //console.log(response);
        if(response.length==0)
        {
          this.isNewteam=true;
        }
        else
        {
          //only one record should be returned
          this.currentRecord  = response[response.length-1];
          this.currentRecord.bat = [];
          this.currentRecord.bowl=[];
          this.currentRecord.ar=[];
          this.currentRecord.wk=[];
          this.currentRecord.filler=[];
          var localRecord = this.jsonCopy(this.currentRecord);
          this.form.teamName = localRecord.teamName;
          this.form.team=localRecord.team;
          this.form.c=localRecord.c;
          this.form.vc=localRecord.vc;
          this.form.bat=[];
          this.form.bowl=[];
          this.form.ar=[];
          this.form.wk=[];
          this.form.filler=[];
          this.subs = localRecord.subs;
          this.isNewteam=false;
          //alert(this.players.length);
          for(var i=0;i<this.form.team.length;i++)
          {
            var player = this.form.team[i];
            switch (player.category) {
              case "Bat":
              {
                if(this.form.bat.length<3)
                {
                  this.form.bat.push(player);
                  this.currentRecord.bat.push(player);
                }
                else {
                  this.form.filler.push(player);
                  this.currentRecord.filler.push(player);
                }
                break;
              }
              case "Bowl":
              {
                if(this.form.bowl.length<3)
                {
                  this.form.bowl.push(player);
                  this.currentRecord.bowl.push(player);
                }
                else {
                  this.form.filler.push(player);
                  this.currentRecord.filler.push(player);
                }
                break;
              }
              case "AR":
              {
                if(this.form.ar.length<2)
                {
                  this.form.ar.push(player);
                  this.currentRecord.ar.push(player);
                }
                else {
                  this.form.filler.push(player);
                  this.currentRecord.filler.push(player);
                }
                break;
              }
              case "WK":
              {
                if(this.form.wk.length==0)
                {
                  this.form.wk.push(player);
                  this.currentRecord.wk.push(player);
                }
                else {
                  this.form.filler.push(player);
                  this.currentRecord.filler.push(player);
                }
                break;
              }
              default:
                break;
            }
            this.players.splice(this.players.map(function(e) { return e.name; }).indexOf(player.name),1);
            this.cachePlayers=this.jsonCopy(this.players);
            this.budget+=player.salary;
          }
        }
      });
    }).then(response=>{
      API.get('usersApi',"/lockedteams/"+username).then((response)=>{
        this.lockedTeam = response[response.length-1];
      })
    });
    }
  }
</script>
