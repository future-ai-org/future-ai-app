import { describe, expect, it } from "vitest";

import { copy } from "./copy";

describe("copy.nav", () => {
  it("includes main navigation aria label", () => {
    expect(copy.nav.ariaLabel).toBe("main navigation");
  });
});
