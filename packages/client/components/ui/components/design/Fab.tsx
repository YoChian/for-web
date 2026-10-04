import { type JSX, splitProps } from "solid-js";

import { cva } from "styled-system/css";

type Props = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "tertiary" | "surface";
};

/**
 * Floating action buttons help people take primary actions
 *
 * @library Discord-like skin (fork customization)
 */
export function Fab(props: Props) {
  const [local, rest] = splitProps(props, ["variant", "class"]);

  return (
    <button
      type="button"
      {...rest}
      class={`${fab({ variant: local.variant })} ${local.class ?? ""}`}
    />
  );
}

const fab = cva({
  base: {
    display: "grid",
    placeItems: "center",
    width: "48px",
    height: "48px",
    border: "none",
    borderRadius: "var(--borderRadius-lg)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.24)",
    cursor: "pointer",
    outline: "none",
    transition: "var(--transitions-fast) background",

    "&:focus-visible": {
      outline: "2px solid var(--md-sys-color-primary)",
      outlineOffset: "2px",
    },
  },
  variants: {
    variant: {
      primary: {
        color: "var(--md-sys-color-on-primary)",
        fill: "var(--md-sys-color-on-primary)",
        background: "var(--md-sys-color-primary)",

        "&:hover": {
          background:
            "color-mix(in srgb, var(--md-sys-color-primary) 85%, black)",
        },
      },
      secondary: {
        color: "var(--md-sys-color-on-secondary-container)",
        fill: "var(--md-sys-color-on-secondary-container)",
        background: "var(--md-sys-color-secondary-container)",
      },
      tertiary: {
        color: "var(--md-sys-color-on-tertiary)",
        fill: "var(--md-sys-color-on-tertiary)",
        background: "var(--md-sys-color-tertiary)",
      },
      surface: {
        color: "var(--md-sys-color-on-surface)",
        fill: "var(--md-sys-color-on-surface)",
        background: "var(--md-sys-color-surface-container-high)",
      },
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});
