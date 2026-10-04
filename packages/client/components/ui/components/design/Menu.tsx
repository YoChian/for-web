import { type JSX, splitProps } from "solid-js";

/**
 * Single option of a FloatingSelect
 *
 * Only declares the option: FloatingSelect reads `data-value` and moves the
 * element into its own list (fork customization).
 */
export function MenuItem(
  props: JSX.HTMLAttributes<HTMLDivElement> & {
    value?: string;
  },
) {
  const [local, rest] = splitProps(props, ["value"]);

  return <div {...rest} data-value={local.value ?? ""} />;
}
