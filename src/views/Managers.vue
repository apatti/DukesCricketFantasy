<template>
  <div class="container">
    <b-table striped bordered hover :items="managers" :busy="isBusy" :fields="fields" >
      <div slot="table-busy" class="text-center text-danger my-2">
          <b-spinner class="align-middle" />
          <strong>Loading...</strong>
      </div>
      <template slot="#" slot-scope="data">
        {{ data.index+1}}
      </template>
      <template slot="email" slot-scope="data">
        {{ data.value.substring(0,data.value.indexOf("@"))}}@XYZ.com
      </template>
    </b-table>
  </div>
</template>

<script>
  import { API } from "aws-amplify";
  export default{
    name:"Managers",
    data(){
      return{
        isBusy:true,
        managers:[],
        fields: [
          '#',
          {key:'username',sortable:true},
          {key:'email',sortable:true}
        ]
      }
    },
    mounted() {
      //do something after mounting vue instance
      API.get('usersApi',"/users").then(response=>{
          this.managers =response;
          this.isBusy=false;
          //alert(JSON.stringify(this.managers));
      });
    }
  }
</script>
