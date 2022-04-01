const request = require("supertest");
const app = require("../../app");
const { loadPlanetsPromise } = require("../../models/planets.model");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");

describe("Launches API", () => {
  beforeAll(async () => {
    await mongoConnect();
    await loadPlanetsPromise();
  });

  describe("Test GET /v1/launches", () => {
    test("It should respond with 200 success", async () => {
      await request(app)
        .get("/v1/launches")
        .expect(200)
        .expect("Content-Type", /json/);
    });
  });

  describe("Test POST /v1/launches", () => {
    const completeLaunchData = {
      mission: "USS",
      rocket: "NCC K23",
      target: "Kepler-62 f",
      launchDate: "January 5, 2027",
    };

    const completeLaunchDataInvalidDate = {
      mission: "USS",
      rocket: "NCC K23",
      target: "Kepler-62 f",
      launchDate: "zoot",
    };

    const completeLaunchDataNoDate = {
      mission: "USS",
      rocket: "NCC K23",
      target: "Kepler-62 f",
    };

    test("It should respond with 201 success", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(completeLaunchData)
        .expect(201)
        .expect("Content-Type", /json/);

      const requestDate = new Date(completeLaunchData.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();
      expect(responseDate).toBe(requestDate);

      expect(response.body).toMatchObject(completeLaunchDataNoDate);
    });

    test("It should catch missing required properties", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(completeLaunchDataNoDate)
        .expect(400)
        .expect("Content-Type", /json/);

      expect(response.body).toStrictEqual({
        error: "Missing required launch property",
      });
    });

    test("It should catch invalid dates", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(completeLaunchDataInvalidDate)
        .expect(400)
        .expect("Content-Type", /json/);

      expect(response.body).toStrictEqual({
        error: "Invalid launch date",
      });
    });
  });

  afterAll(async () => mongoDisconnect());
});
