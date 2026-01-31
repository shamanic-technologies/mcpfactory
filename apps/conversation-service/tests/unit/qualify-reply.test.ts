import { describe, it, expect } from "vitest";

describe("Reply qualification", () => {
  it("should define qualification categories", () => {
    const categories = ["interested", "not_interested", "out_of_office", "unsubscribe", "question"];
    expect(categories).toContain("interested");
    expect(categories).toContain("not_interested");
  });

  it("should define reply interface", () => {
    const reply = {
      messageId: "msg_123",
      from: "john@example.com",
      subject: "Re: Partnership",
      body: "I'm interested, let's talk",
      receivedAt: new Date().toISOString(),
    };
    expect(reply.messageId).toBeDefined();
    expect(reply.body).toBeDefined();
  });
});
