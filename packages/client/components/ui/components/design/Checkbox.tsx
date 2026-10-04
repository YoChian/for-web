import { type JSX, Show } from "solid-js";

import { Checkbox as ArkCheckbox } from "@ark-ui/solid";
import { cva } from "styled-system/css";

type Props = {
  children?: JSX.Element;
  required?: boolean;
  name?: string;
  checked?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  class?: string;
  onChange?: (event: { currentTarget: { checked: boolean } }) => void;
};

const root = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "var(--gap-md)",
    cursor: "pointer",
    userSelect: "none",
    color: "var(--md-sys-color-on-surface)",

    "&[data-disabled]": {
      cursor: "not-allowed",
      opacity: 0.5,
    },

    "&[data-readonly]": {
      cursor: "inherit",
    },
  },
});

const control = cva({
  base: {
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    width: "20px",
    height: "20px",
    borderRadius: "var(--borderRadius-sm)",
    border: "2px solid var(--md-sys-color-outline)",
    color: "var(--md-sys-color-on-primary)",
    transition:
      "var(--transitions-fast) background, var(--transitions-fast) border-color",

    "&[data-hover]:not([data-state=checked]):not([data-state=indeterminate])": {
      borderColor: "var(--md-sys-color-on-surface-variant)",
    },

    "&[data-state=checked], &[data-state=indeterminate]": {
      background: "var(--md-sys-color-primary)",
      borderColor: "var(--md-sys-color-primary)",
    },

    "&[data-focus-visible]": {
      outline: "2px solid var(--md-sys-color-primary)",
      outlineOffset: "2px",
    },

    "& > [data-part=indicator]:not([hidden])": {
      display: "grid",
    },

    "& svg": {
      width: "16px",
      height: "16px",
      fill: "currentcolor",
    },
  },
});

/**
 * Checkboxes let users select one or more items from a list, or turn an item on or off
 *
 * Without `onChange` or `name` the checkbox only displays `checked`, and the
 * click is left to the surrounding element (e.g. a category button).
 *
 * @library Ark UI + Discord-like skin (fork customization)
 */
export function Checkbox(props: Props) {
  const displayOnly = () =>
    props.checked !== undefined && !props.onChange && !props.name;

  return (
    <ArkCheckbox.Root
      class={`${root()} ${props.class ?? ""}`}
      checked={props.indeterminate ? "indeterminate" : props.checked}
      onCheckedChange={(details) =>
        props.onChange?.({
          currentTarget: { checked: details.checked === true },
        })
      }
      name={props.name}
      required={props.required}
      disabled={props.disabled}
      readOnly={displayOnly()}
    >
      <ArkCheckbox.Control class={control()}>
        <ArkCheckbox.Indicator>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
          </svg>
        </ArkCheckbox.Indicator>
        <ArkCheckbox.Indicator indeterminate>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 13H5v-2h14z" />
          </svg>
        </ArkCheckbox.Indicator>
      </ArkCheckbox.Control>
      <Show when={props.children}>
        <ArkCheckbox.Label>{props.children}</ArkCheckbox.Label>
      </Show>
      {/* the surrounding element takes focus in display-only mode */}
      <ArkCheckbox.HiddenInput tabIndex={displayOnly() ? -1 : undefined} />
    </ArkCheckbox.Root>
  );
}
