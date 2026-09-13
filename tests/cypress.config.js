const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5007',
    specPattern: ['backend/**/*.cy.js', 'frontend/**/*.cy.js'],
    supportFile: false,
    testIsolation: false,
    screenshotOnRunFailure: false,
  },
});
