import { JSXElement } from "solid-js";

import { cva } from "styled-system/css";

interface Props {
  children?: JSXElement;
  variant: "small" | "large";
}

/**
 * Badges show notifications, counts, or status information on navigation items and icons
 *
 * @library Discord-like skin (fork customization)
 */
export function Badge(props: Props) {
  return (
    <span class={badge({ variant: props.variant })}>
      {props.variant === "large" && props.children}
    </span>
  );
}

const badge = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderRadius: "var(--borderRadius-full)",
    background: "var(--md-sys-color-error)",
    color: "var(--md-sys-color-on-error)",
    fontSize: "12px",
    fontWeight: 700,
    lineHeight: 1,
    fontFeatureSettings: "'tnum' 1",
  },
  variants: {
    variant: {
      small: {
        width: "8px",
        height: "8px",
      },
      large: {
        minWidth: "16px",
        height: "16px",
        paddingInline: "4px",
      },
    },
  },
});
