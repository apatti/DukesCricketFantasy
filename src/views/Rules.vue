<template>
  <div class="container">
    <div class="text-center mt-3" style="margin-bottom:0">
      <h3 class="display-8"><span v-html="title"></span></h3>
    </div>
    <div class="mt-5">
      <b-tabs content-class="mt-3">
        <b-tab title="Format" active><span v-html="format"></span></b-tab>
        <b-tab title="Team composition"><span v-html="teamcomposition"></span></b-tab>
        <b-tab title="Points System"><span v-html="points"></span></b-tab>
        <b-tab title="Phases"><span v-html="phase"></span></b-tab>
        <b-tab title="Subs"><span v-html="Subs"></span></b-tab>
        <b-tab title="Budget"><span v-html="budget"></span></b-tab>
        <b-tab title="Draft"><span v-html="draft"></span></b-tab>
        <b-tab title="Replace Drafted Players"><span v-html="transfer"></span></b-tab>
        <b-tab title="Prize Distribution"><span v-html="prize"></span></b-tab>
      </b-tabs>
    </div>
  </div>
</template>

<script>
  import { API } from "aws-amplify";
  export default{
    name:"Rules",
    components: {
      //UnderConstruction
    },
    data()
    {
      return{
        title:"",
        subs:"",
        budget:"",
        draft:"",
        format:"",
        phase:"",
        points:"",
        teamcomposition:"",
        transfer:"",
        prize:""
      }
    },
    mounted() {
      //do something after mounting vue instance
      API.get('usersApi',"/rules/wc2019").then(response=>{
          var record = response[0];
          this.title = record.title;
          this.format = record.format;
          this.Subs = record.Subs;
          this.draft = record.draft;
          this.budget = record.budget;
          this.points = record.points;
          this.phase = record.phase;
          this.teamcomposition = record.teamcomposition;
          this.transfer = record.transfer;
          this.prize = record.prize;
          this.isBusy=false;
          //alert(JSON.stringify(this.managers));
      });
    }
  }
</script>
