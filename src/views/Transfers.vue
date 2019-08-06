<template>
  <div class="container">
    <b-form @submit="onSubmit">
      <div>
        <b-form-group
          id="draftedPlayerSelectGroup"
          label="Pick the drafted player:"
          label-for="draftedSelect">
          <b-form-select id="draftedSelect" v-model="draftPlayer" @change="onDraftSelected">
            <template slot="first">
              <option :value="null" disabled>-- Please select the player --</option>
            </template>
            <option v-for="index in draftPlayers.length" :key="index" :value="draftPlayers[index-1]">
              {{draftPlayers[index-1].name + " ("+draftPlayers[index-1].team+") - "+draftPlayers[index-1].category+" - $"+draftPlayers[index-1].salary}}
            </option>
          </b-form-select>
        </b-form-group>
        <b-form-group
          id="newPlayerSelectGroup"
          label="Pick the replacement player:"
          label-for="playerSelect"
          >
          <b-form-select id="playerSelect" v-model="replacementPlayer" @change="onReplacementSelected">
            <template slot="first">
              <option :value="null" disabled>-- Please select the replacement --</option>
            </template>
            <option v-for="index in players.length" :key="index" :value="players[index-1]">
              {{players[index-1].name + " ("+players[index-1].team+") - "+players[index-1].category+" - $"+players[index-1].salary}}
            </option>
          </b-form-select>
        </b-form-group>
      </div>
      <div>
        <b-form-group
        id="input-group-1"
        label="Bid Amount:"
        label-for="input-bidAmount"
        description="Please enter the bid amount.">
          <b-form-input
            id="input-bidAmount"
            v-model="bidAmount"
            type="number"
            required
            placeholder="Enter the bid amount">
          </b-form-input>
        </b-form-group>
      </div>
      <div>
        <b-form-group
        id="input-group-2"
        label="Subs cost:"
        label-for="input-subsCost"
        description="Number of subs to give away.">
          <b-form-input
            id="input-subsCost"
            v-model="replacementCost"
            type="number"
            disabled>
          </b-form-input>
        </b-form-group>
      </div>
      <div>
        <b-button type="submit" variant="primary" class="ml-1">Submit</b-button>
      </div>
    </b-form>
  </div>
</template>
<script>
  import { API } from "aws-amplify";
  export default{
    name: "Transfers",
    data(){
      return{
        draftPlayer:null,
        bidAmount:0,
        players:[],
        draftPlayers:[],
        replacementPlayer:null,
        allPlayers:[],
        currentTeam:[],
        lockedTeams:[],
        replacePlayerOwners:[],
        replacementCost:0,
        username:null
      }
    },
    methods: {
      onSubmit(evt) {
        evt.preventDefault();
        var date = new Date();
        var timestamp = Math.floor(date.getTime()/1000);
        API.post('usersApi',"/playertransfer/",{body:{
          "user":this.username,
          "playerRemove":this.draftPlayer,
          "add":this.replacementPlayer.name,
          "remove":this.draftPlayer.name,
          "playerAdd":this.replacementPlayer,
          "bidAmount":this.bidAmount,
          "timestamp":timestamp,
          "subs":this.replacementCost,
          "status":"Pending",
          "localtime":date.toString()
        }}).then(response=>{
          if(response && response.hasOwnProperty('success'))
          {
            alert("Replacement request successfully made.")
          }
          else {
            //console.log(response);
            //this.teamSubmissionErrorText=JSON.stringify(response.error);
            //this.$refs.myModalRef.show();
            alert(JSON.stringify(response.error));
          }
        });
      },
      onReset(evt){
        evt.preventDefault();
      },
      onReplacementSelected(){
        var playerExistUsers = this.lockedTeams.filter(
                                userTeam=>{
                                  return (
                                    userTeam.team.find(t=> t.name==this.replacementPlayer.name)!=undefined) &&
                                    (userTeam.username!=this.username)});
        this.replacementCost = playerExistUsers.length*2;
      },
      onDraftSelected(){
        let newPlayerBudget=this.currentTeam.reduce((a,b)=>{
          if(b.name!=this.draftPlayer.name)
          {
            return a-=b.salary
          }
          else {
            return a;
          }
        },1000000);

        var draftedNotPicked = this.draftPlayers.find(player=>player.name!=this.draftPlayer.name);

        this.players=this.allPlayers.filter(player=>player.category!="Wicket-Keeper" &&
                                                    player.category!=draftedNotPicked.category &&
                                                    (this.currentTeam.find(p=>p.name==player.name) ||
                                                    player.salary <= newPlayerBudget &&
                                                    this.validateTeamComposition(player.category))
                                            );
      },
      validateTeamComposition(playerCategory)
      {
        var teamCatMap = this.currentTeam.reduce((a,b)=>{
          (a[b.category]=a[b.category]+1||1);
          return a
        },{});
        teamCatMap[this.draftPlayer.category]-=1;
        teamCatMap[playerCategory]+=1;
        if(teamCatMap.Batsman>=3 &&
          teamCatMap.Bowler>=3 &&
          teamCatMap['Wicket-Keeper']>=1 &&
          teamCatMap['All-Rounder']>=2
        )
        {
          return true;
        }
        else {
          return false;
        }
      }
    },
    created() {
      //do something after creating vue instance
      this.username=this.$route.params.username;
      this.currentTeam = this.$route.params.userteam;
      if(this.currentTeam!=null)
      {
        this.currentTeam = this.currentTeam.team;
      }
      for(var i=0;i<this.currentTeam.length;i++)
      {
        //console.log(this.currentTeam[i]);
        if(this.currentTeam[i].drafted==true)
        {
          this.draftPlayers.push(this.currentTeam[i]);
        }
      }
    },
    mounted() {
      //do something after mounting vue instance
      API.get('usersApi',"/players").then(response=>{
          for(var i=0;i<response.length;i++)
          {
            if(response[i].drafted==false)
            {
              this.allPlayers.push(response[i]);
            }
          }
      }).then(response=>{
        API.get('usersApi',"/lockedteams").then((response)=>{
          if(response.length>0){
            this.lockedTeams= response;
          }
        });
      });
    }
  };
</script>
