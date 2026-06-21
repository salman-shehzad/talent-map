require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const app = require("./app");
const connectDb = require("./config/db");

const port = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`API running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Unable to connect to MongoDB.");
    console.error(error.message);
    process.exit(1);
  });
