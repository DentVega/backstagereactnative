import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { ThemeProvider } from "../theme/ThemeProvider";
import { Button } from "../primitives/Button";
import { AppText } from "../primitives/AppText";
import { resolveTheme } from "../theme/resolveTheme";

function wrap(ui: React.ReactElement): React.ReactElement {
  return <ThemeProvider scheme="light">{ui}</ThemeProvider>;
}

describe("resolveTheme", () => {
  it("selects palettes deterministically", () => {
    expect(resolveTheme("light").scheme).toBe("light");
    expect(resolveTheme("dark").scheme).toBe("dark");
    expect(resolveTheme("light").colors.background).not.toBe(
      resolveTheme("dark").colors.background,
    );
  });
});

describe("Button", () => {
  it("renders its label with a button role", () => {
    render(wrap(<Button label="Continuar" onPress={() => {}} />));
    expect(screen.getByRole("button", { name: "Continuar" })).toBeOnTheScreen();
  });

  it("fires onPress when enabled", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    render(wrap(<Button label="Pagar" onPress={onPress} />));
    await user.press(screen.getByRole("button", { name: "Pagar" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress when disabled", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    render(wrap(<Button label="Pagar" onPress={onPress} disabled />));
    await user.press(screen.getByRole("button", { name: "Pagar" }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("AppText", () => {
  it("renders text content", () => {
    render(wrap(<AppText>Saldo</AppText>));
    expect(screen.getByText("Saldo")).toBeOnTheScreen();
  });
});
