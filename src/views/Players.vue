<template>
  <div>
    <b-table striped bordered hover :items="playersJson" :fields="fields" >
    </b-table>
  </div>
</template>

<script>
  import playersJson from '../data/players.json'
  export default{
    name:"Players",
    playersJson,
    data(){
      return{
        fields: [
          {key:'Player',sortable:false},
          {key:'Name',sortable:true},
          {key:'Salary',sortable:true,sortDirection:'desc'},
          {key:'Team',sortable:true},
          {key:'Category',sortable:true}],
        playersJson
      }
    }
  }
</script>
