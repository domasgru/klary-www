<template>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Demo: Vue and Eleventy</title>
      <link rel="preconnect" href="https://fonts.gstatic.com">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <style v-html="css"/>
    </head>
    <body>
      <landing />
    </body>
  </html>
</template>

<script>
import landing from "./_includes/landing.vue";

export default {
  components: {
      landing
  },
  computed: {
    css: function() {
      return this.getVueComponentCssForPage(this.page.url);
    }
  }
}
</script>

<style>
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html,
body {
  height: 100%;
}

body {
  font-family: 'Inter', sans-serif;
  color: #17171A;
}

a {
    text-decoration: none;
    color: #17171A;
}
</style>