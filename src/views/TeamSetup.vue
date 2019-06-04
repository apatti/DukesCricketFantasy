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
          :busy="isBusy"
          @row-selected="droppedListSelected"
          stripped fixed small bordered caption-top>
          <div slot="table-busy" class="text-center text-danger my-2">
              <b-spinner class="align-middle" />
              <strong>Loading...</strong>
            </div>
            <template slot="table-caption"><strong>Budget:${{budget}}/{{1000000}}<br/>
              Remaining:${{1000000-budget}}<br/>
              <p >Salary Utilization
                <b-progress class="mt-2" :max=100 :value="(budget/1000000)*100" show-value variant="info"/>
              </p>
              Subs:{{subs}}
              <p>
                Points:{{points}}
              </p>
              <p>
                Phase Points:{{phase}}
              </p>
              <p>
                Last update: {{localtime}}
              </p>
              </strong>

            </template>
          </b-table>
          <div class="row justify-content-center align-items-center">
            <b-button variant="success" class="ml-1"  @click="onPlayerAdd" >Add</b-button>
            <b-button variant="danger" class="ml-1"  @click="onPlayerRemove">Remove</b-button>
          </div>
          <div>
            <b-button v-b-toggle.collapse1 class="mb-2" variant="info">{{playerCollapseText}}</b-button>
            <b-collapse id="collapse1" visible class="mt-2">
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
            <b-modal id="modal2" title="Team successfully added!!" ref="teamChangesModalRef" :ok-only=true>
                <p class="my-4"><span v-html="changeText"></span></p>
            </b-modal>
            <b-modal id="modal3" title="Team Reset options!!" ref="teamResetModalRef" ok-variant="primary" ok-title="Cancel" :ok-only=true>
                <p class="my-4">Previous Submit time:<br/> {{localtime}}</p>
                <b-button class="mt-3" variant="outline-danger" block @click="onPreviousReset">Reset to previous submission</b-button>
                <p class="my-4">Previous Locked time:<br/> {{previousLockedTime}}</p>

                <b-button class="mt-3" variant="outline-danger" block @click="onLockedReset">Reset to locked state</b-button>
            </b-modal>
          </div>
      </b-form>
      <div>
        <b-button class="mt-3 mb-3" variant="warning" :to="{ name: 'transfers', params: { username: username,userteam:lockedTeam }}">Player Transfer</b-button>
      </div>
    </div>
  </div>
</template>

<script>
  import { API } from "aws-amplify";
  export default{
    name: "TeamSetup",
    data(){
      return {
        localtime:"",
        previousLockedTime:"",
        isBusy:true,
        playerCollapseText:"Hide players",
        budget:0,
        subs:85,
        points:0,
        phase:0,
        lockedTeam:null,
        filter:"",
        currentRecord:null,
        cachePlayers:null,
        changeText:"",
        form:{
          teamName:"",
          team:[],
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
          {key:'name',sortable:true,formatter:'captainCheck'},
          {key:'team',sortable:true},
          {key:'category',sortable:true},
          {key:'salary',sortable:true}
        ],
        playersToAdd:[],
        playersToDrop:[],
        budgetExceeded:false,
        teamSubmissionErrorText:"",
        username:null
      }
    },
    computed:{
      validation() {
        return this.form.teamName.length >0;
      }
    },
    created() {
      //do something after creating vue instance
      this.username=this.$route.params.username;
    },
    methods: {
      captainCheck(value) {
        if(value==this.form.c)
        {
          if(value==this.form.vc)
          {
            return value + " (C/VC)";
          }
          else {
            return value + " (C)";
          }
        }
        if(value==this.form.vc) {
          return value + " (VC)";
        }

        return value;
      },
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
        var newSubCount=85;
        if(this.lockedTeam==null || this.isNewteam)
        {
          newSubCount=85;
        }
        else {
          newSubCount=this.lockedTeam.subs-this.getSubCount();
        }
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
          "points":this.points,
          "phase":this.phase,
          "version":"v1",
          "isNewteam":this.isNewteam,
          "lockedTeam":this.lockedTeam
        }}).then(response=>{
          if(response && response.hasOwnProperty('success'))
          {
            this.changeText=JSON.stringify(changes);
            this.$refs.teamChangesModalRef.show();

          }
          else {
            //console.log(response);
            this.teamSubmissionErrorText=JSON.stringify(response.error);
            this.$refs.myModalRef.show();
            //alert(JSON.stringify(response.error));
          }
        });
      },
      addListSelected(items){
        this.playersToAdd=items;
      },
      droppedListSelected(items){
        var invalidRemovals = items.map(e=>e.drafted==true);
        //var invalidRemovals = items.splice(items.map(function(e) { return e.drafted; }).indexOf(true),1);
        if(invalidRemovals.indexOf(true)>-1)
        {
          alert("Warning!! drafted players cannot be removed!");
          //alert(JSON.stringify(invalidRemovals));
          for(var re=0;re<invalidRemovals.length;re++)
          {
            if(invalidRemovals[re]==true)
            {
              items.splice(re,1);
            }
          }
          //items.splice(invalidRemovals.indexOf(true),1);
        }
        this.playersToDrop=items;
      },
      getCategoryCount(team){
        var catCount={"Batsman":3,"Bowler":3,"Wicket-Keeper":1,"All-Rounder":2,"f":2}
        for(var i=0;i<team.length;i++)
        {
          catCount[team[i].category]--;
        }
        if(catCount['Batsman']<0)
        {
          catCount.f += catCount['Batsman'];
          catCount['Batsman']=0
        }
        if(catCount['Bowler']<0)
        {
          catCount.f += catCount['Bowler'];
          catCount['Bowler']=0
        }
        if(catCount['All-Rounder']<0)
        {
          catCount.f += catCount['All-Rounder'];
          catCount['All-Rounder']=0
        }
        if(catCount['Wicket-Keeper']<0)
        {
          catCount.f += catCount['Wicket-Keeper'];
          catCount['Wicket-Keeper']=0
        }
        return catCount;
      },
      onReset(evt){
        evt.preventDefault();
        this.$refs.teamResetModalRef.show();
      },
      onPreviousReset(evt) {
        evt.preventDefault();
        this.$refs.teamResetModalRef.hide();
        this.budgetExceeded=false;
        this.players=this.cachePlayers;
        if(this.currentRecord===null)
        {
          this.form.teamName="";
          this.form.c="";
          this.form.vc="";
          this.form.team=[];
        }
        else {
          var currentRecord = this.jsonCopy(this.currentRecord);
          this.form.teamName=currentRecord.teamName;
          this.form.c = currentRecord.c;
          this.form.vc=currentRecord.vc;
          this.form.team=currentRecord.team;
        }
      },
      onLockedReset(evt){
        evt.preventDefault();
        this.$refs.teamResetModalRef.hide();
        this.budgetExceeded=false;
        this.players=this.cachePlayers;
        if(this.lockedTeam===null)
        {
          this.form.teamName="";
          this.form.c="";
          this.form.vc="";
          this.form.team=[];
        }
        else {
          var lockedTeam = this.jsonCopy(this.lockedTeam);
          this.form.teamName=lockedTeam.teamName;
          this.form.c = lockedTeam.c;
          this.form.vc=lockedTeam.vc;
          this.form.team=lockedTeam.team;
          this.subs=lockedTeam.subs;
          this.points=lockedTeam.points;
          this.phase=lockedTeam.phase;
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
          this.teamSubmissionErrorText="Addition of players would make your player count more than 11 !!";
          this.$refs.myModalRef.show();
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
          else {
            this.teamSubmissionErrorText="Adding "+player.name+" would violate team combination rules.\n Valid combo: Batsman:3, Bowler:3, AR:2, WK:1, Fillers: 2";
            this.$refs.myModalRef.show();
          }
        }
        this.budget = this.calculateBudget();
        this.playersToAdd=[];
      },
      onPlayerRemove(evt){
        evt.preventDefault();
        for(var i=0;i<this.playersToDrop.length;i++)
        {
          var player = this.playersToDrop[i];
          if(player.drafted==true)
          {
            alert("Cannot drop drafted player!!");
            continue;
          }
          this.form.team.splice(this.form.team.map(function(e) { return e.name; }).indexOf(player.name),1);
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
      this.$root.$on('bv::collapse::state', (collapseId, isJustShown) => {
        if(!isJustShown)
        {
          this.playerCollapseText="Show Players";
        }
        else {
          this.playerCollapseText="Hide Players";
        }

      });
      //do something after mounting vue instance
      //let username = localStorage.getItem("username");
      let username = this.username;

      API.get('usersApi',"/players").then(response=>{
          for(var i=0;i<response.length;i++)
          {
            if(response[i].drafted==false)
            {
              this.players.push(response[i]);
              //console.log(this.players);
              //this.cachePlayers.push(response[i]);
              //this.cachePlayers=response;
            }
          }
          //console.log(JSON.stringify(this.players));
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
          var localRecord = this.jsonCopy(this.currentRecord);
          this.form.teamName = localRecord.teamName;
          this.form.team=localRecord.team;
          this.form.c=localRecord.c;
          this.form.vc=localRecord.vc;
          this.subs = localRecord.subs;
          this.localtime=localRecord.localtime;
          this.isNewteam=false;
          //alert(this.players.length);
          for(var i=0;i<this.form.team.length;i++)
          {
            var player = this.form.team[i];
            if(player.drafted!=true)
            {
              this.players.splice(this.players.map(function(e) { return e.name; }).indexOf(player.name),1);
            }
            this.budget+=player.salary;
          }
          this.cachePlayers=this.jsonCopy(this.players);
        }
        this.isBusy=false;
      });
    }).then(response=>{
      API.get('usersApi',"/lockedteams/"+username).then((response)=>{
        if(response.length>0){
          this.lockedTeam = response[response.length-1];
          this.points = this.lockedTeam.points;
          this.phase = this.lockedTeam.phase;
          this.previousLockedTime=this.lockedTeam.localtime;
        }
      })
    });
    }
  }
</script>
