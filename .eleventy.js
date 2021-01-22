const eleventyVue = require("@11ty/eleventy-plugin-vue");
const CleanCSS = require("clean-css");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(eleventyVue);

  eleventyConfig.addPassthroughCopy('img');

  eleventyConfig.addFilter("cssmin", function(code) {
    console.log(code)
    return new CleanCSS({}).minify(code).styles;
  });

  eleventyConfig.addTransform("add-html-doctype", (content, outputPath) => {
    let doctype = "<!doctype html>";
    // If we’re writing to an HTML file and a Doctype does not already exist
    if(outputPath.endsWith(".html") && !content.trim().toLowerCase().startsWith(doctype)) {
      return `${doctype}${content}`;
    }
    return content;
  });
};