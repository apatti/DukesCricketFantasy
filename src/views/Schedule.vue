<template>
  <div>
    <b-table striped bordered hover :items="scheduleJson" :fields="fields" >
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
          {key:'Match',sortable:true},
          'Date',
          {key:'Home',sortable:true},
          {key:'Away',sortable:true},
          {key:'Venue',sortable:true}],
        scheduleJson
      }
    }
  }
</script>
