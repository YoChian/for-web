import type { JSX } from "solid-js";
import {
  Match,
  Show,
  Switch,
  createEffect,
  on,
  onCleanup,
  splitProps,
} from "solid-js";

import { Field, PasswordInput } from "@ark-ui/solid";
import { cva } from "styled-system/css";

import { Symbol } from "../utils/Symbol";

type Props = JSX.HTMLAttributes<HTMLInputElement> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  autoFocus?: boolean;
  required?: boolean;
  name?: string;
  label?: string;
  autosize?: boolean;
  disabled?: boolean;
  rows?: number;
  "min-rows"?: number;
  "max-rows"?: number;
  maxlength?: number;
  minlength?: number;
  counter?: boolean;
  placeholder?: string;
  type?:
    | "text"
    | "number"
    | "password"
    | "url"
    | "email"
    | "search"
    | "tel"
    | "hidden"
    | "date"
    | "datetime-local"
    | "month"
    | "time"
    | "week";
  variant?: "filled" | "outlined";
  enterkeyhint?:
    | "enter"
    | "done"
    | "go"
    | "next"
    | "previous"
    | "search"
    | "find";
  helper?: string;
  "helper-on-focus"?: boolean;
  clearable?: boolean;
  "clear-icon"?: string;
  "end-aligned"?: boolean;
  prefix?: string;
  suffix?: string;
  icon?: string;
  "end-icon"?: string;
  "error-icon"?: string;
  form?: string;
  readonly?: boolean;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  "toggle-password"?: boolean;
  showPasswordIcon?: string;
  hidePasswordIcon?: string;
  autocapitalize?: "none" | "sentences" | "words" | "characters";
  autocorrect?: string;
  autocomplete?: string;
  spellcheck?: boolean;
  inputmode?:
    | "none"
    | "text"
    | "decimal"
    | "numeric"
    | "tel"
    | "search"
    | "email"
    | "url";
  autofocus?: boolean;
  tabindex?: number;
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

const labelStyle = cva({
  base: {
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    color: "var(--md-sys-color-on-surface-variant)",
    userSelect: "none",

    "&[data-disabled]": {
      opacity: 0.5,
    },
  },
});

const input = cva({
  base: {
    width: "100%",
    height: "40px",
    paddingInline: "12px",
    fontSize: "15px",
    fontFamily: "inherit",
    color: "var(--md-sys-color-on-surface)",
    borderRadius: "var(--borderRadius-md)",
    border: "1px solid transparent",
    outline: "none",
    transition:
      "var(--transitions-fast) border-color, var(--transitions-fast) background",
    cursor: "text",

    "&::placeholder": {
      color:
        "color-mix(in srgb, 45% var(--md-sys-color-on-surface), transparent)",
    },

    "&:focus": {
      borderColor: "var(--md-sys-color-primary)",
    },

    "&[data-invalid], &[aria-invalid=true]": {
      borderColor: "var(--md-sys-color-error)",
    },

    "&:disabled": {
      opacity: 0.45,
      cursor: "not-allowed",
    },
  },
  variants: {
    variant: {
      filled: {
        // a step darker than the content behind it, like Discord inputs
        background: "var(--md-sys-color-surface-dim)",
        borderColor:
          "color-mix(in srgb, 40% var(--md-sys-color-outline-variant), transparent)",

        "&:focus": {
          borderColor: "var(--md-sys-color-primary)",
        },
      },
      outlined: {
        background: "transparent",
        borderColor: "var(--md-sys-color-outline-variant)",
      },
    },
    multiline: {
      true: {
        height: "auto",
        paddingBlock: "10px",
        lineHeight: "20px",
        resize: "vertical",
      },
    },
    autosize: {
      true: {
        resize: "none",
      },
    },
    trailingAction: {
      true: {
        paddingInlineEnd: "40px",
      },
    },
  },
  defaultVariants: {
    variant: "filled",
  },
});

const passwordControl = cva({
  base: {
    position: "relative",
  },
});

const visibilityTrigger = cva({
  base: {
    position: "absolute",
    insetBlock: 0,
    insetInlineEnd: "4px",
    marginBlock: "auto",
    display: "grid",
    placeItems: "center",
    width: "32px",
    height: "32px",
    padding: 0,
    border: "none",
    borderRadius: "var(--borderRadius-md)",
    background: "transparent",
    color: "var(--md-sys-color-on-surface-variant)",
    cursor: "pointer",

    "&:hover": {
      color: "var(--md-sys-color-on-surface)",
    },

    // MDUI hides the toggle on disabled fields
    "&:disabled": {
      display: "none",
    },
  },
});

const detailRow = cva({
  base: {
    display: "flex",
    justifyContent: "space-between",
    gap: "var(--gap-md)",
    fontSize: "11px",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

/**
 * Grow a textarea to fit its content
 *
 * Ark's `autoresize` is not used: it patches `value` to re-dispatch `input`
 * on every programmatic change, so Form2 would mark the control dirty again
 * right after a reset.
 *
 * @returns Function to re-measure the textarea
 */
function autosize(el: HTMLTextAreaElement) {
  function resize() {
    el.style.height = "auto";

    // not laid out yet, keep the height given by `rows`
    if (!el.scrollHeight) return;

    const style = getComputedStyle(el);
    el.style.height = `${
      el.scrollHeight +
      parseFloat(style.borderTopWidth) +
      parseFloat(style.borderBottomWidth)
    }px`;
  }

  // width changes re-wrap the text
  const observer = new ResizeObserver(() => requestAnimationFrame(resize));
  observer.observe(el);
  el.addEventListener("input", resize);

  onCleanup(() => {
    observer.disconnect();
    el.removeEventListener("input", resize);
  });

  return resize;
}

/**
 * Text fields let users enter text into a UI
 *
 * @library Ark UI (Field, PasswordInput) + Discord-like skin (fork customization)
 */
export function TextField(props: Props) {
  const [local, rest] = splitProps(props, [
    "label",
    "variant",
    "counter",
    "helper",
    "autoFocus",
    "autosize",
    "rows",
    "min-rows",
    "max-rows",
    "required",
    "disabled",
    "readonly",
    "class",
    "toggle-password",
    "showPasswordIcon",
    "hidePasswordIcon",
  ]);

  // the password input manages its own type and autocomplete
  const [native, attrs] = splitProps(rest, ["type", "autocomplete"]);

  return (
    <Field.Root
      class={`${root()} ${local.class ?? ""}`}
      required={local.required}
      disabled={local.disabled}
      readOnly={local.readonly}
    >
      <Show when={local.label}>
        <Field.Label class={labelStyle()}>{local.label}</Field.Label>
      </Show>
      <Switch
        fallback={
          <Field.Input
            {...(attrs as JSX.InputHTMLAttributes<HTMLInputElement>)}
            type={native.type}
            autocomplete={native.autocomplete}
            autofocus={local.autoFocus || rest.autofocus}
            class={input({ variant: local.variant })}
          />
        }
      >
        {/* MDUI semantics: `autosize` or `rows` turns the field into a textarea */}
        <Match when={local.autosize || local.rows !== undefined}>
          <Field.Textarea
            {...(attrs as JSX.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            ref={(el) => {
              if (!local.autosize) return;
              // programmatic value changes don't fire `input`
              createEffect(on(() => rest.value, autosize(el)));
            }}
            rows={local.autosize ? (local["min-rows"] ?? 1) : local.rows}
            // rows × 20px line height + 2 × 10px padding + 2 × 1px border
            style={
              local.autosize && local["max-rows"]
                ? { "max-height": `${local["max-rows"] * 20 + 22}px` }
                : undefined
            }
            autocomplete={native.autocomplete}
            autofocus={local.autoFocus || rest.autofocus}
            class={input({
              variant: local.variant,
              multiline: true,
              autosize: local.autosize,
            })}
          />
        </Match>
        <Match when={native.type === "password" && local["toggle-password"]}>
          <PasswordInput.Root
            autoComplete={
              native.autocomplete === "new-password"
                ? "new-password"
                : "current-password"
            }
          >
            <PasswordInput.Control class={passwordControl()}>
              <PasswordInput.Input
                {...(attrs as JSX.InputHTMLAttributes<HTMLInputElement>)}
                autofocus={local.autoFocus || rest.autofocus}
                class={input({ variant: local.variant, trailingAction: true })}
              />
              <PasswordInput.VisibilityTrigger class={visibilityTrigger()}>
                {/* MDUI semantics: `showPasswordIcon` shows while revealed */}
                <PasswordInput.Indicator
                  fallback={
                    <Symbol size={20}>
                      {local.hidePasswordIcon ?? "visibility"}
                    </Symbol>
                  }
                >
                  <Symbol size={20}>
                    {local.showPasswordIcon ?? "visibility_off"}
                  </Symbol>
                </PasswordInput.Indicator>
              </PasswordInput.VisibilityTrigger>
            </PasswordInput.Control>
          </PasswordInput.Root>
        </Match>
      </Switch>
      <Show when={local.helper || (local.counter && rest.maxlength)}>
        <div class={detailRow()}>
          <span>{local.helper}</span>
          <Show when={local.counter && rest.maxlength}>
            <span>
              {String(rest.value ?? "").length} / {rest.maxlength}
            </span>
          </Show>
        </div>
      </Show>
    </Field.Root>
  );
}
