<template>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="description" content="Personal feedback sharing platform">
      <title>Kuri - personal feedback sharing platform</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style v-html="css"/>
      <script type="text/javascript">
        WebFontConfig = {
            google: { families: [ 'Inter:400,600,700' ] }
        };
        (function() {
            var wf = document.createElement('script');
            wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
            wf.type = 'text/javascript';
            wf.async = 'true';
            var s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(wf, s);
        })(); 
    </script>
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