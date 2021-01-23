<template>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="description" content="Personal feedback sharing platform">
      <meta property="og:title" content="Personal feedback sharing platform">
      <meta property="og:description" content="Give, receive, and discuss feedbacks in one place.">
      <meta property="og:image" content="https://kuriapp.com/img/ogimage.png">
      <meta property="og:url" content="https://kuriapp.com/index.html">
      <title>Kuri - personal feedback sharing platform</title>
      <link rel="preconnect" href="https://fonts.gstatic.com">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
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