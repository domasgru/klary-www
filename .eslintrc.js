module.exports = {
  extends: [
    // add more generic rulesets here, such as:
    // 'eslint:recommended',
    // 'airbnb-base',
    'plugin:vue/vue3-recommended',
    'plugin:vue/vue3-essential', // This option doesn't impose formatting rules
  ],
  rules: {
    // override/add rules settings here, such as:
    'vue/no-unused-vars': 'error',
    indent: ['error', 2],
    'eslint linebreak-style': [
      0,
      'error',
      'windows',
    ],
    'max-len': [
      'error',
      {
        code: 140,
        ignoreStrings: true,
      },
    ],
  },
};
