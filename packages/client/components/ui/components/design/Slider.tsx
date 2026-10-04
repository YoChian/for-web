import { type JSX, splitProps } from "solid-js";

import { Slider as ArkSlider } from "@ark-ui/solid";
import { cva } from "styled-system/css";

type Props = Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  "onChange" | "onInput" | "aria-label" | "aria-labelledby"
> & {
  "aria-label"?: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  labelFormatter?: (value: number) => string;
  onChange?: (event: { currentTarget: { value: number } }) => void;
  onInput?: (event: { currentTarget: { value: number } }) => void;
};

const root = cva({
  base: {
    width: "100%",

    "&[data-disabled]": {
      opacity: 0.5,
    },
  },
});

const control = cva({
  base: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    height: "24px",
    cursor: "pointer",

    "&[data-disabled]": {
      cursor: "not-allowed",
    },
  },
});

const track = cva({
  base: {
    flexGrow: 1,
    height: "8px",
    borderRadius: "4px",
    background: "var(--md-sys-color-outline-variant)",
  },
});

const range = cva({
  base: {
    height: "100%",
    borderRadius: "inherit",
    background: "var(--md-sys-color-primary)",
  },
});

const thumb = cva({
  base: {
    width: "10px",
    height: "24px",
    borderRadius: "3px",
    background: "#ffffff",
    border: "1px solid #dcddde",
    boxShadow:
      "0 3px 1px rgba(0, 0, 0, 0.05), 0 2px 2px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05)",
    cursor: "ew-resize",
    outline: "none",

    "&:focus-visible": {
      outline: "2px solid var(--md-sys-color-primary)",
      outlineOffset: "2px",
    },

    "&:hover > span, &[data-dragging] > span, &:focus-visible > span": {
      opacity: 1,
    },
  },
});

const bubble = cva({
  base: {
    position: "absolute",
    bottom: "calc(100% + 8px)",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "4px 8px",
    borderRadius: "var(--borderRadius-sm)",
    background: "var(--md-sys-color-inverse-surface)",
    color: "var(--md-sys-color-inverse-on-surface)",
    fontSize: "14px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    pointerEvents: "none",
    opacity: 0,
    transition: "var(--transitions-fast) opacity",
  },
});

/**
 * Sliders let users make selections from a range of values
 *
 * @library Ark UI + Discord-like skin (fork customization)
 */
export function Slider(props: Props) {
  const [local, rest] = splitProps(props, [
    "class",
    "aria-label",
    "min",
    "max",
    "step",
    "value",
    "labelFormatter",
    "onChange",
    "onInput",
  ]);

  const format = (value: number) =>
    local.labelFormatter?.(value) ?? String(value);

  return (
    <ArkSlider.Root
      {...rest}
      class={`${root()} ${local.class ?? ""}`}
      // one label per thumb
      aria-label={local["aria-label"] ? [local["aria-label"]] : undefined}
      min={local.min}
      max={local.max}
      step={local.step}
      value={[local.value]}
      getAriaValueText={(details) => format(details.value)}
      onValueChange={(details) =>
        local.onInput?.({ currentTarget: { value: details.value[0] } })
      }
      onValueChangeEnd={(details) =>
        local.onChange?.({ currentTarget: { value: details.value[0] } })
      }
    >
      <ArkSlider.Control class={control()}>
        <ArkSlider.Track class={track()}>
          <ArkSlider.Range class={range()} />
        </ArkSlider.Track>
        <ArkSlider.Thumb index={0} class={thumb()}>
          <span class={bubble()}>{format(local.value)}</span>
          <ArkSlider.HiddenInput />
        </ArkSlider.Thumb>
      </ArkSlider.Control>
    </ArkSlider.Root>
  );
}
