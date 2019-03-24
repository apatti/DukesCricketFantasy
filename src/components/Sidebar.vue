<template>
  <div class="wrapper">
    <nav id="sidebar">
      <div class="sidebar-header">
        <h3>Welcome</h3>
      </div>
      <ul class="list-unstyled components">
        <li>
          <a href="#">Home</a>
        </li>
        <li>
          <a href="#">Standings</a>
        </li>
        <li>
          <a href="#">Players</a>
        </li>
        <li>
          <a href="#">Schedule</a>
        </li>
        <li>
          <a href="#">About</a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script>
  export default {
    name: "Sidebar"
  }
</script>

<style scoped>
  .wrapper {
    display: flex;
    width: 100%;
  }

  #sidebar {
    width: 250px;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 999;
    background: #7386D5;
    transition: all 0.3s;
  }

</style>
