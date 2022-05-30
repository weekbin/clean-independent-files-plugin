const { WebpackCleanUndependentFilesPlugin } = require("./clean");

module.exports = {
  mode: "development",
  plugins: [
    new WebpackCleanUndependentFilesPlugin({
      autoDelete: true,
    }),
  ],
};
