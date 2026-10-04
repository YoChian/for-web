import { JSXElement } from "solid-js";

import { cva } from "styled-system/css";

/**
 * Lists are continuous, vertical indexes of text and images
 *
 * @library Discord-like skin (fork customization)
 */
export function List(props: { children: JSXElement }) {
  return <div class={list()}>{props.children}</div>;
}

const list = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
});

/**
 * A subheader used in a list
 */
function ListSubheader(props: { children: JSXElement }) {
  return <div class={subheader()}>{props.children}</div>;
}

List.Subheader = ListSubheader;

const subheader = cva({
  base: {
    paddingBlock: "16px 8px",
    paddingInline: "10px",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    color: "var(--md-sys-color-on-surface-variant)",
    userSelect: "none",
  },
});

/**
 * An item that appears in a list
 *
 * Leading content (e.g. an avatar) comes first in the children.
 */
function ListItem(props: {
  children: JSXElement;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const interactive = () => !!props.onClick && !props.disabled;

  return (
    <div
      class={listitem({ disabled: props.disabled })}
      role={props.onClick ? "button" : undefined}
      tabIndex={interactive() ? 0 : undefined}
      aria-disabled={props.disabled}
      onClick={() => interactive() && props.onClick!()}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
    >
      {props.children}
    </div>
  );
}

List.Item = ListItem;

const listitem = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-l)",
    minHeight: "48px",
    paddingBlock: "8px",
    paddingInline: "10px",
    borderRadius: "var(--borderRadius-lg)",
    color: "var(--md-sys-color-on-surface)",
    cursor: "pointer",
    outline: "none",
    transition: "var(--transitions-fast) background",

    "&:hover": {
      background:
        "color-mix(in srgb, var(--md-sys-color-on-surface) 6%, transparent)",
    },

    "&:focus-visible": {
      boxShadow: "inset 0 0 0 2px var(--md-sys-color-primary)",
    },
  },
  variants: {
    disabled: {
      true: {
        cursor: "default",
        color: "var(--md-sys-color-on-surface-variant)",

        "&:hover": {
          background: "transparent",
        },
      },
    },
  },
});
