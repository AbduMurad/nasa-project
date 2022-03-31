const { getAllPlanets } = require("../../models/planets.model");

const httpGetAllPlanets = async (req, res) => {
  res.status(200).json(await getAllPlanets());
};

module.exports = { httpGetAllPlanets };
