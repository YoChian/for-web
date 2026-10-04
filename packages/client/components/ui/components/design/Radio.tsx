import { type JSX, Show, createContext, useContext } from "solid-js";

import { RadioGroup } from "@ark-ui/solid";
import { cva } from "styled-system/css";

interface GroupProps {
  value?: string;
  onChange?: (event: { currentTarget: { value: string } }) => void;
  required?: boolean;
  disabled?: boolean;
  children?: JSX.Element;
}

interface Props {
  value?: string;
  children?: JSX.Element;
  checked?: boolean;
}

/**
 * Whether options are rendered inside a group
 */
const GroupContext = createContext(false);

const group = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-md)",
  },
});

const item = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-l)",
    padding: "10px 12px",
    borderRadius: "var(--borderRadius-md)",
    background: "var(--md-sys-color-surface-container-low)",
    color: "var(--md-sys-color-on-surface-variant)",
    fontWeight: 500,
    cursor: "pointer",
    userSelect: "none",
    transition: "var(--transitions-fast) background",

    "&[data-hover]": {
      background:
        "color-mix(in srgb, var(--md-sys-color-on-surface) 6%, var(--md-sys-color-surface-container-low))",
    },

    "&[data-state=checked]": {
      color: "var(--md-sys-color-on-secondary-container)",
      background: "var(--md-sys-color-secondary-container)",
    },

    "&[data-disabled]": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
});

const control = cva({
  base: {
    position: "relative",
    flexShrink: 0,
    width: "20px",
    height: "20px",
    borderRadius: "var(--borderRadius-full)",
    border: "2px solid var(--md-sys-color-outline)",
    transition: "var(--transitions-fast) border-color",

    "&[data-state=checked]": {
      borderColor: "var(--md-sys-color-primary)",
    },

    "&[data-state=checked]::after": {
      content: '""',
      position: "absolute",
      inset: "3px",
      borderRadius: "var(--borderRadius-full)",
      background: "var(--md-sys-color-primary)",
    },

    "&[data-focus-visible]": {
      outline: "2px solid var(--md-sys-color-primary)",
      outlineOffset: "2px",
    },
  },
  variants: {
    // follow the text colour of a tinted surrounding element
    inherit: {
      true: {
        borderColor: "currentcolor",

        "&[data-state=checked]": {
          borderColor: "currentcolor",
        },

        "&[data-state=checked]::after": {
          background: "currentcolor",
        },
      },
    },
  },
});

/**
 * Radio buttons let people select one option from a set of options
 *
 * @library Ark UI + Discord-like skin (fork customization)
 */
export function Radio2(props: GroupProps) {
  return (
    <GroupContext.Provider value={true}>
      <RadioGroup.Root
        class={group()}
        value={props.value}
        onValueChange={(details) =>
          details.value !== null &&
          props.onChange?.({ currentTarget: { value: details.value } })
        }
        required={props.required}
        disabled={props.disabled}
      >
        {props.children}
      </RadioGroup.Root>
    </GroupContext.Provider>
  );
}

/**
 * Radio buttons let people select one option from a set of options
 *
 * Outside of a group the option only displays `checked`, and the click is
 * left to the surrounding element (e.g. a category button).
 *
 * @library Ark UI + Discord-like skin (fork customization)
 */
Radio2.Option = function Option(props: Props) {
  const inGroup = useContext(GroupContext);

  return (
    <Show
      when={inGroup}
      fallback={
        <span
          class={control({ inherit: true })}
          data-state={props.checked ? "checked" : "unchecked"}
          aria-hidden="true"
        />
      }
    >
      <RadioGroup.Item class={item()} value={props.value ?? ""}>
        <RadioGroup.ItemControl class={control()} />
        <RadioGroup.ItemText>{props.children}</RadioGroup.ItemText>
        <RadioGroup.ItemHiddenInput />
      </RadioGroup.Item>
    </Show>
  );
};
