<template>
  <div id="app">
    <Header/>
    <MainApp/>
    <Footer/>
  </div>
</template>

<script>
import MainApp from './components/MainApp.vue'
import Footer from './components/Footer'
import Header from './components/Header'

export default {
  name: 'App',
  components: {
    MainApp,
    Header,
    Footer
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#app::-webkit-scrollbar-track
{
	-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
	border-radius: 10px;
	background-color: #F5F5F5;
}

#app::-webkit-scrollbar
{
	width: 12px;
	background-color: #F5F5F5;
}

#app::-webkit-scrollbar-thumb
{
	border-radius: 10px;
	-webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
	background-color: #D62929;
}
</style>
