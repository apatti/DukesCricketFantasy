<template>
  <div class="container">
    <strong> WC Drafted Player Transfers </strong>
    <b-table
    :items="transfers"
    :fields="transferFields"
    :busy="isBusy"
    striped small bordered caption-top>
    <div slot="table-busy" class="text-center text-danger my-2">
        <b-spinner class="align-middle" />
        <strong>Loading...</strong>
      </div>
    <template slot="owner" slot-scope="data">
      <router-link  :to="{ name: 'team', params: { username: data.item.user}}">{{data.value}}</router-link>
    </template>
    </b-table>
  </div>
</template>
<script>
  import { API } from "aws-amplify";

  export default{
    name:"TransferResults",
    data(){
      return{
        transfers:[],
        isBusy:true,
        transferFields: [
          {key:'#',sortable:true},
          {key:'user',sortable:true},
          {key:'add',sortable:true},
          {key:'remove',sortable:true},
          {key:'bidAmount',sortable:true},
          {key:'localtime',sortable:true},
          {key:'status',sortable:true},
          {key:'subs',sortable:true},
        ]
      }
    },
    methods: {
      transferCompare(a,b) {
        if(a.timestamp>b.timestamp) return -1;
        if(a.timestamp<b.timestamp) return 1;
        return 0;
      }
    },
    mounted() {
      //do something after mounting vue instance
      API.get('usersApi',"/transferlist/").then(response =>{
        if(response.length!=0)
        {
          this.transfers=response;
          this.transfers.sort(this.transferCompare);
          for(var j=0;j<this.transfers.length;j++)
          {
            this.transfers[j]["#"]=j+1;
          }
          this.isBusy=false;
        }
      });
    }
  }
</script>
