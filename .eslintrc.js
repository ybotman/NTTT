// .eslintrc.js
module.exports = {
  root: true,
  env: {
    browser: true, // If your code runs in the browser
    es6: true, // Enable ES6 globals (like Promise)
    es2021: true,
    node: true, // Enable Node.js globals (if applicable)
  },
  extends: [
    "next",
    "next/core-web-vitals",
    "eslint:recommended",
    "plugin:jsx-a11y/recommended",
  ],
  parserOptions: {
    ecmaVersion: 2021, // Enable modern JavaScript syntax
    sourceType: "module",
  },
  rules: {
    // "react-hooks/exhaustive-deps": "off",
    //  "no-undef": "off",
    //  "no-unused-vars": "off",
  },
};
