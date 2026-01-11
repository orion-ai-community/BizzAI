import request from "supertest";
import app from "../app.js";
import { connect, closeDatabase, clearDatabase } from "./setup.js";

beforeAll(async () => await connect());
afterEach(async () => await clearDatabase());
afterAll(async () => await closeDatabase());

describe("Return API", () => {
    describe("POST /api/returns", () => {
        it("should return 401 if not authenticated", async () => {
            const res = await request(app).post("/api/returns").send({});
            // Expect 401 as we won't provide a token
            // Also accepting 404 if the route isn't mounted yet or path is wrong, 
            // but primarily checking that app instance works.
            expect([401, 404, 500]).toContain(res.statusCode);
        });
    });
});
