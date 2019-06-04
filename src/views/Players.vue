<template>
  <div>
    <b-table striped bordered hover :items="playersJson" :fields="fields" :busy="isBusy" >
      <div slot="table-busy" class="text-center text-danger my-2">
          <b-spinner class="align-middle" />
          <strong>Loading...</strong>
      </div>
      <template slot="name" slot-scope="data">
        <b-link :href="data.item.profile" target="_blank">{{data.value}}</b-link>
      </template>
    </b-table>
  </div>
</template>

<script>
  import { API } from "aws-amplify";
  export default{
    name:"Players",
    data(){
      return{
        fields: [
          {key:'id',sortable:true,sortDirection:'asc'},
          {key:'name',sortable:true},
          {key:'team',sortable:true},
          {key:'category',sortable:true},
          {key:'salary',sortable:true},
          {key:'manager',sortable:true,label:'owner'},
          {key:'draftprice',sortable:true,label:'price'}
        ],
        playersJson:[],
        isBusy:true
      }
    },
    mounted() {
      //do something after mounting vue instance
      API.get('usersApi',"/players?allPlayers=true").then(response=>{
          this.playersJson =response;
          this.isBusy=false;
          //alert(JSON.stringify(this.managers));
      });
    }
  }
</script>
