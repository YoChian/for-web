import "@material/web/ripple/ripple.js";
import { cva } from "styled-system/css";

interface Props {
  disabled?: boolean;
}

/**
 * Ripple overlay provides hover and pressed states for interactive elements
 *
 * You should ensure the parent element has relative positioning:
 *
 * ```tsx
 * <div class={css({ position: 'relative' })}>
 *   <Ripple />
 *   .. your content
 * </div>
 * ```
 *
 * Under the Discord preset the ripple gives way to a flat state layer, as
 * Discord has no press ripples (fork customization).
 *
 * @library Material Web Components
 * @specification https://m3.material.io/foundations/interaction/states/applying-states
 */
export function Ripple(props: Props) {
  return (
    <>
      <md-ripple class={ripple()} {...props} />
      <span
        class={stateLayer()}
        data-disabled={props.disabled}
        aria-hidden="true"
      />
    </>
  );
}

const ripple = cva({
  base: {
    _discord: {
      display: "none",
    },
  },
});

const stateLayer = cva({
  base: {
    display: "none",
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    pointerEvents: "none",
    background: "currentcolor",
    opacity: 0,
    transition: "var(--transitions-fast) opacity",

    // kept outside of _discord: Panda would put the condition after `>`
    ":hover > &": {
      opacity: 0.08,
    },

    ":active > &": {
      opacity: 0.12,
    },

    _discord: {
      display: "block",

      "&[data-disabled=true]": {
        display: "none",
      },
    },
  },
});
