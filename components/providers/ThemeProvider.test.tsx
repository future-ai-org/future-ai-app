import { cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider, useTheme } from "./ThemeProvider";

const STORAGE_KEY = "future-theme";

/** Vitest/Node sometimes exposes a partial localStorage; use a full in-memory store for these tests. */
function installMemoryLocalStorage() {
  const store = new Map<string, string>();
  const ls = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  };
  vi.stubGlobal("localStorage", ls);
  return () => store.clear();
}

function ThemeProbe() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button type="button" onClick={() => setTheme("dark")}>
        go-dark
      </button>
      <button type="button" onClick={() => setTheme("light")}>
        go-light
      </button>
    </div>
  );
}

function matchMediaResult(query: string, matches: boolean) {
  return {
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

describe("ThemeProvider", () => {
  let resetStorage: () => void;

  beforeAll(() => {
    resetStorage = installMemoryLocalStorage();
  });

  beforeEach(() => {
    resetStorage();
    document.documentElement.classList.remove("light", "dark");
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) =>
      matchMediaResult(query, false),
    );
  });

  afterEach(() => {
    cleanup();
    vi.mocked(window.matchMedia).mockRestore();
  });

  it("throws when useTheme runs outside ThemeProvider", () => {
    expect(() => renderHook(() => useTheme())).toThrow(/ThemeProvider/);
  });

  it("applies dark from localStorage when set", () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });

  it("defaults to dark when storage is empty", () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) =>
      matchMediaResult(query, query === "(prefers-color-scheme: light)"),
    );
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("setTheme updates state, document class, and storage", () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    fireEvent.click(screen.getByRole("button", { name: "go-light" }));
    expect(screen.getByTestId("theme").textContent).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
    fireEvent.click(screen.getByRole("button", { name: "go-dark" }));
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
