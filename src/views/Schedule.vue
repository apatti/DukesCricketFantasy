<template>
  <div>
    <b-table striped bordered hover :items="scheduleJson" :fields="fields" >
      <template slot="title" slot-scope="data">
        <b-link :href="data.item.matchlink" target="_blank">{{data.value}}</b-link>
      </template>
    </b-table>
  </div>
</template>

<script>
  import scheduleJson from '../data/schedule.json'
  export default{
    name:"Schedule",
    scheduleJson,
    data(){
      return{
        fields: [
          {key:'match',sortable:true},
          {key:'timestamp',sortable:true,label:'Date'},
          {key:'title',sortable:true,label:'Match Details'},
          {key:'venue',sortable:true},
          {key:'time',sortable:true}],
        scheduleJson
      }
    }
  }
</script>
