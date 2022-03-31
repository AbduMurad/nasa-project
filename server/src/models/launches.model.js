const axios = require("axios");

const launchesMongo = require("./launches.mongo");
const planets = require("./planets.mongo");

const DEFAULT_FLIGHT_NUMBER = 100;
const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query";

const populateLaunches = async () => {
  console.log("Downloading launch data...");
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.error("Problem Downloading launches");
    throw new Error("Launch data download failed");
  }

  const launchDocs = response.data.docs;
  for (let launchDoc of launchDocs) {
    const payLoads = launchDoc["payloads"];
    const customers = payLoads.flatMap((payload) => {
      return payload["customers"];
    });

    const launch = {
      flightNumber: launchDoc.flight_number,
      mission: launchDoc.name, // name
      rocket: launchDoc.rocket.name, // exists in rocket.name
      launchDate: launchDoc.date_local, // date_local
      upcoming: launchDoc.upcoming, // upcoming
      success: launchDoc.success, // success
      customers,
    };

    console.log(`${launch.flightNumber} ${launch.mission}`);
    await saveLaunch(launch);
  }
};

const loadLaunchData = async () => {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });

  if (firstLaunch) {
    console.log("Launch data already loaded...");
  } else {
    await populateLaunches();
  }
};

const findLaunch = async (filter) => {
  return launchesMongo.findOne(filter);
};

const existsLaunchWithId = async (launchId) => {
  return findLaunch({ flightNumber: launchId });
};

const getLatesFlightNumber = async () => {
  const latestLaunch = await launchesMongo.findOne().sort("-flightNumber");
  if (!latestLaunch.flightNumber) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return latestLaunch.flightNumber;
};

const getAllLaunches = async (skip, limit) => {
  return launchesMongo
    .find({}, "-_id -__v")
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
};

const saveLaunch = async (launchPlan) => {
  await launchesMongo.findOneAndUpdate(
    {
      flightNumber: launchPlan.flightNumber,
    },
    launchPlan,
    { upsert: true }
  );
};

const scheduleNewLaunch = async (newLaunchData) => {
  const planet = await planets.findOne({ keplerName: newLaunchData.target });

  if (!planet) {
    throw new Error("No matching planet was found!");
  }
  const newLaunchFlightNumber = (await getLatesFlightNumber()) + 1;
  const newLaunch = Object.assign(newLaunchData, {
    flightNumber: newLaunchFlightNumber,
    upcoming: true,
    success: true,
    customers: ["Zero To Mastery", "NASA"],
  });

  await saveLaunch(newLaunch);
};

const abortLaunchById = async (launchId) => {
  const aborted = await launchesMongo.updateOne(
    { flightNumber: launchId },
    { upcoming: false, success: false }
  );
  return aborted.modifiedCount === 1;
};

module.exports = {
  loadLaunchData,
  existsLaunchWithId,
  getAllLaunches,
  scheduleNewLaunch,
  abortLaunchById,
};
