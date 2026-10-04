import {
  TonalPalette,
  argbFromHex,
  hexFromArgb,
} from "@material/material-color-utilities";

import type { MaterialColours, SurfaceRoles } from "./materialTheme";

/**
 * Neutral roles of the Discord-like scheme (fork customization)
 *
 * Surfaces stay neutral grey regardless of the accent, the way Discord does.
 * Mapped onto the Material roles the app is styled with:
 * - surface-container-lowest: main content (chat)
 * - surface-container-low: app shell and sidebars
 * - surface-container: menus and message hover
 * - surface-container-high: composer, dialogs, search
 */
const NEUTRALS = {
  dark: {
    "surface-dim": "#1e1f22",
    surface: "#313338",
    "surface-bright": "#3a3c42",
    "surface-container-lowest": "#313338",
    "surface-container-low": "#2b2d31",
    "surface-container": "#232428",
    "surface-container-high": "#383a40",
    "surface-container-highest": "#404249",
    "on-surface": "#dbdee1",
    "on-surface-variant": "#949ba4",
    // also used for channel names, so these stay readable as text
    outline: "#80848e",
    "outline-variant": "#4e5058",
    "inverse-surface": "#111214",
    "inverse-on-surface": "#dbdee1",

    secondary: "#b5bac1",
    "on-secondary": "#1e1f22",
    "secondary-container": "#404249",
    "on-secondary-container": "#ffffff",
    "secondary-fixed": "#e3e5e8",
    "secondary-fixed-dim": "#c4c9ce",
    "on-secondary-fixed": "#1e1f22",
    "on-secondary-fixed-variant": "#3f4147",

    tertiary: "#23a55a",
    "on-tertiary": "#ffffff",
    "tertiary-container": "#1a4a31",
    "on-tertiary-container": "#a6e9c2",
    "tertiary-fixed": "#a6e9c2",
    "tertiary-fixed-dim": "#6fd49a",
    "on-tertiary-fixed": "#00210f",
    "on-tertiary-fixed-variant": "#1a4a31",

    error: "#f23f43",
    "on-error": "#ffffff",
    "error-container": "#5b1f22",
    "on-error-container": "#ffb3b5",

    scrim: "#000000",
    shadow: "#000000",
  },
  light: {
    "surface-dim": "#e3e5e8",
    surface: "#ffffff",
    "surface-bright": "#ffffff",
    "surface-container-lowest": "#ffffff",
    "surface-container-low": "#f2f3f5",
    "surface-container": "#f6f6f7",
    "surface-container-high": "#ebedef",
    "surface-container-highest": "#e3e5e8",
    "on-surface": "#313338",
    "on-surface-variant": "#5c5e66",
    outline: "#6d6f78",
    "outline-variant": "#c4c9ce",
    "inverse-surface": "#111214",
    "inverse-on-surface": "#f2f3f5",

    secondary: "#4e5058",
    "on-secondary": "#ffffff",
    "secondary-container": "#d4d7dc",
    "on-secondary-container": "#060607",
    "secondary-fixed": "#e3e5e8",
    "secondary-fixed-dim": "#c4c9ce",
    "on-secondary-fixed": "#1e1f22",
    "on-secondary-fixed-variant": "#3f4147",

    tertiary: "#1f8b4c",
    "on-tertiary": "#ffffff",
    "tertiary-container": "#d3f5e1",
    "on-tertiary-container": "#0e5a31",
    "tertiary-fixed": "#a6e9c2",
    "tertiary-fixed-dim": "#6fd49a",
    "on-tertiary-fixed": "#00210f",
    "on-tertiary-fixed-variant": "#1a4a31",

    error: "#da373c",
    "on-error": "#ffffff",
    "error-container": "#fde7e8",
    "on-error-container": "#8c1d21",

    scrim: "#000000",
    shadow: "#000000",
  },
} satisfies Record<"dark" | "light", Omit<MaterialColours, PrimaryRole>>;

type PrimaryRole =
  | "primary"
  | "on-primary"
  | "primary-container"
  | "on-primary-container"
  | "primary-fixed"
  | "primary-fixed-dim"
  | "on-primary-fixed"
  | "on-primary-fixed-variant"
  | "inverse-primary";

/**
 * Discord surfaces that no Material role lines up with
 */
const SURFACES = {
  dark: {
    frame: "#1e1f22",
    floating: "#111214",
    dialog: "#313338",
    "settings-sidebar": "#2b2d31",
    settings: "#313338",
    card: "#404249",
    scrollbar: "#1a1b1e",
  },
  light: {
    frame: "#e3e5e8",
    floating: "#ffffff",
    dialog: "#ffffff",
    "settings-sidebar": "#f2f3f5",
    settings: "#ffffff",
    card: "#f2f3f5",
    scrollbar: "#c4c9ce",
  },
} satisfies Record<"dark" | "light", SurfaceRoles>;

/**
 * Get the Discord surface roles
 * @param darkMode Dark mode
 * @returns Surface roles
 */
export function generateDiscordSurfaces(darkMode: boolean): SurfaceRoles {
  return SURFACES[darkMode ? "dark" : "light"];
}

/**
 * Mix two #rrggbb colours
 * @param a First colour
 * @param b Second colour
 * @param weight Share of the first colour, from 0 to 1
 */
function mix(a: string, b: string, weight: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const channel = (shift: number) =>
    Math.round(
      ((pa >> shift) & 255) * weight + ((pb >> shift) & 255) * (1 - weight),
    )
      .toString(16)
      .padStart(2, "0");

  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

/**
 * Generate a Discord-like colour scheme
 * @param accent Accent colour in hex format, used as-is for primary
 * @param darkMode Dark mode
 * @returns Material colours
 */
export function generateDiscordScheme(
  accent: string,
  darkMode: boolean,
): MaterialColours {
  const argb = argbFromHex(accent);
  const tones = TonalPalette.fromInt(argb);
  const tone = (t: number) => hexFromArgb(tones.tone(t));

  // normalise #rgb / #rrggbbaa input to #rrggbb
  const base = hexFromArgb(argb);
  const neutrals = NEUTRALS[darkMode ? "dark" : "light"];

  return {
    ...neutrals,

    primary: base,
    "on-primary": "#ffffff",
    // accent tint over the content surface, like Discord mentions
    "primary-container": darkMode
      ? mix(base, neutrals["surface-container-lowest"], 0.3)
      : mix(base, neutrals["surface-container-lowest"], 0.15),
    "on-primary-container": darkMode
      ? mix(base, "#ffffff", 0.3)
      : mix(base, "#000000", 0.75),
    "primary-fixed": tone(90),
    "primary-fixed-dim": tone(80),
    "on-primary-fixed": tone(10),
    "on-primary-fixed-variant": tone(30),
    "inverse-primary": tone(darkMode ? 40 : 80),
  };
}
