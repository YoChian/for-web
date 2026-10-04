import {
  type JSX,
  For,
  Show,
  children as accessChildren,
  createMemo,
} from "solid-js";
import { Portal } from "solid-js/web";

import { Select, createListCollection } from "@ark-ui/solid";
import { cva } from "styled-system/css";

type FloatingSelectPropsLabel =
  | { required: true; label: string }
  | { required?: false; label?: string };

type FloatingSelectProps = FloatingSelectPropsLabel & {
  value?: string;
  disabled?: boolean;
  variant?: "filled" | "outlined";
  children: JSX.Element;
  onChange?: (event: { currentTarget: { value: string } }) => void;
  onOpened?: () => void;
};

/**
 * Option declared through a MenuItem child
 */
type Option = {
  value: string;
  label: string;
  element: HTMLElement;
};

const root = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-sm)",
    width: "100%",
    minWidth: 0,
  },
});

const label = cva({
  base: {
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    color: "var(--md-sys-color-on-surface-variant)",
    userSelect: "none",
  },
});

const trigger = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-md)",
    width: "100%",
    height: "40px",
    paddingInline: "12px 8px",
    borderRadius: "var(--borderRadius-md)",
    border: "1px solid transparent",
    color: "var(--md-sys-color-on-surface)",
    fontSize: "15px",
    fontFamily: "inherit",
    textAlign: "start",
    cursor: "pointer",
    outline: "none",
    transition: "var(--transitions-fast) border-color",

    "&:focus-visible, &[data-state=open]": {
      borderColor: "var(--md-sys-color-primary)",
    },

    "&:disabled": {
      opacity: 0.45,
      cursor: "not-allowed",
    },
  },
  variants: {
    variant: {
      filled: {
        background: "var(--md-sys-color-surface-dim)",
        borderColor:
          "color-mix(in srgb, 40% var(--md-sys-color-outline-variant), transparent)",
      },
      outlined: {
        background: "transparent",
        borderColor: "var(--md-sys-color-outline-variant)",
      },
    },
  },
  defaultVariants: {
    variant: "filled",
  },
});

const valueText = cva({
  base: {
    flexGrow: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

const indicator = cva({
  base: {
    display: "grid",
    flexShrink: 0,
    color: "var(--md-sys-color-on-surface-variant)",
    transition: "var(--transitions-medium) transform",

    "&[data-state=open]": {
      transform: "rotate(180deg)",
    },

    "& svg": {
      width: "24px",
      height: "24px",
      fill: "currentcolor",
    },
  },
});

const content = cva({
  base: {
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    maxHeight: "min(40vh, var(--available-height))",
    overflowY: "auto",
    padding: "6px",
    borderRadius: "var(--borderRadius-sm)",
    border:
      "1px solid color-mix(in srgb, 40% var(--md-sys-color-outline-variant), transparent)",
    background: "var(--surface-floating)",
    color: "var(--md-sys-color-on-surface)",
    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.24)",
    outline: "none",
  },
});

const item = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-md)",
    minHeight: "36px",
    padding: "6px 8px",
    borderRadius: "var(--borderRadius-xs)",
    color: "var(--md-sys-color-on-surface-variant)",
    fontSize: "15px",
    cursor: "pointer",

    "& > :first-child": {
      flexGrow: 1,
      minWidth: 0,
    },

    "&[data-highlighted]": {
      color: "var(--md-sys-color-on-surface)",
      background:
        "color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)",
    },

    "&[data-state=checked]": {
      color: "var(--md-sys-color-on-surface)",
    },

    "&[data-disabled]": {
      opacity: 0.45,
      cursor: "not-allowed",
    },
  },
});

const itemIndicator = cva({
  base: {
    display: "grid",
    flexShrink: 0,
    color: "var(--md-sys-color-primary)",

    "& svg": {
      width: "20px",
      height: "20px",
      fill: "currentcolor",
    },
  },
});

/**
 * Select field with its options declared as MenuItem children
 *
 * @library Ark UI (Select) + Discord-like skin (fork customization)
 */
export function FloatingSelect(props: FloatingSelectProps) {
  const resolved = accessChildren(() => props.children);

  const options = createMemo(() =>
    resolved
      .toArray()
      .filter((node): node is HTMLElement => node instanceof HTMLElement)
      .map(
        (element): Option => ({
          value: element.dataset.value ?? "",
          label: element.textContent ?? "",
          element,
        }),
      ),
  );

  const collection = createMemo(() =>
    createListCollection({
      items: options(),
      itemToValue: (option) => option.value,
      itemToString: (option) => option.label,
    }),
  );

  /**
   * Keep an Escape that already closed the list from also closing the
   * surrounding modal through the global keybinds
   *
   * Bound with `on:keydown`: Solid delegates `onKeyDown` to the document,
   * which the event only reaches after the keybind listener on the body.
   */
  function containEscape(event: KeyboardEvent) {
    if (event.key === "Escape" && event.defaultPrevented) {
      event.stopPropagation();
    }
  }

  return (
    <Select.Root
      class={root()}
      collection={collection()}
      // an empty value is the placeholder option
      value={props.value ? [props.value] : []}
      onValueChange={(details) =>
        props.onChange?.({ currentTarget: { value: details.value[0] ?? "" } })
      }
      onOpenChange={(details) => details.open && props.onOpened?.()}
      disabled={props.disabled}
      required={props.required}
      positioning={{ placement: "bottom-start", sameWidth: true, gutter: 4 }}
      loopFocus
    >
      <Show when={props.label}>
        <Select.Label class={label()}>
          {props.label}
          {props.required && " *"}
        </Select.Label>
      </Show>
      <Select.Control>
        <Select.Trigger
          class={trigger({ variant: props.variant })}
          on:keydown={containEscape}
        >
          <Select.ValueText class={valueText()} />
          <Select.Indicator class={indicator()}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </Select.Indicator>
        </Select.Trigger>
      </Select.Control>
      <Portal mount={document.getElementById("floating")!}>
        <Select.Positioner>
          <Select.Content class={content()} on:keydown={containEscape}>
            <For each={options()}>
              {(option) => (
                <Select.Item item={option} class={item()}>
                  {option.element}
                  <Select.ItemIndicator class={itemIndicator()}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                    </svg>
                  </Select.ItemIndicator>
                </Select.Item>
              )}
            </For>
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
