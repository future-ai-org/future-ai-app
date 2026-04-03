import { describe, expect, it } from "vitest";

import { copy } from "./copy";

describe("copy.nav", () => {
  it("includes solar system nav label", () => {
    expect(copy.nav.solarSystem).toBe("solar system");
  });
});
