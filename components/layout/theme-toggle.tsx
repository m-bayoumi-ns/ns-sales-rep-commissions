"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const options = [
  { value: "light", icon: SunIcon, label: "themeLight" },
  { value: "dark", icon: MoonIcon, label: "themeDark" },
] as const;

const subscribe = () => () => {};

/** Light / Dark segmented control (next-themes). */
export function ThemeToggle() {
  const t = useTranslations("header");
  const { resolvedTheme, theme, setTheme } = useTheme();
  const activeTheme = theme === "system" ? resolvedTheme : theme;
  // The stored theme is only known on the client; render no selection on the server.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <ToggleGroup
      aria-label={t("theme")}
      className="rounded-lg bg-muted p-0.5"
      spacing={0}
      value={mounted && activeTheme ? [activeTheme] : []}
      onValueChange={(value) => {
        if (value[0]) setTheme(value[0]);
      }}
    >
      {options.map(({ value, icon: Icon, label }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={t(label)}
          title={t(label)}
          className="size-8 min-w-8 rounded-md px-0 data-pressed:bg-card data-pressed:shadow-sm sm:size-9"
        >
          <Icon aria-hidden />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
