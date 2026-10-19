import { describe, expect, it } from "vitest";
import { LANGUAGES, completion, resolveLanguage, translate } from ".";
import { MESSAGES } from "./messages";

const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe("i18n", () => {
  it("keeps every placeholder in every translation", () => {
    for (const { code } of LANGUAGES) {
      for (const key of MESSAGES) {
        expect(
          placeholders(translate(code, key)),
          `${code}: ${key}`,
        ).toEqual(placeholders(key));
      }
    }
  });

  it("fills placeholders and falls back to English", () => {
    expect(translate("en", "On branch {branch}", { branch: "main" })).toBe(
      "On branch main",
    );
    expect(completion("en")).toBe(100);
  });

  it("follows the system language, then English", () => {
    expect(resolveLanguage("system", ["fr-CA", "en-US"])).toBe("fr");
    expect(resolveLanguage("system", ["pt-PT"])).toBe("pt-BR");
    expect(resolveLanguage("system", ["xx"])).toBe("en");
    expect(resolveLanguage("de", ["fr"])).toBe("de");
  });
});
