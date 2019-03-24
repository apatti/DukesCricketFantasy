<template>
  <div class="container">
    <b-table striped bordered hover :items="managers" :fields="fields" >
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
          //alert(JSON.stringify(this.managers));
      });
    }
  }
</script>
