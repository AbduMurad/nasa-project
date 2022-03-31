require("dotenv").config();
const http = require("http");

const { mongoConnect } = require("./services/mongo");
const app = require("./app");
const { loadPlanetsPromise } = require("./models/planets.model");
const { loadLaunchData } = require("./models/launches.model");

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

async function startServer() {
  await mongoConnect();
  await loadPlanetsPromise();
  await loadLaunchData();
  server.listen(PORT, () => console.log(`App is listening on port ${PORT}...`));
}

startServer();
