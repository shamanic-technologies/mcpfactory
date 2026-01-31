import { describe, it, expect } from "vitest";
import request from "supertest";
import { createTestApp } from "../helpers/test-app.js";

describe("Health endpoints", () => {
  const app = createTestApp();

  it("GET /health returns ok", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", service: "campaign-service" });
  });

  it("GET /unknown returns 404", async () => {
    const response = await request(app).get("/unknown");
    expect(response.status).toBe(404);
  });
});
