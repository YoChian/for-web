import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

/**
 * Progress indicators express an unspecified wait time or display the duration of a process
 *
 * @library Discord-like CSS spinner (fork customization)
 */
export function CircularProgress() {
  return (
    <Base>
      <svg class={spinner()} viewBox="25 25 50 50" role="progressbar">
        <circle cx="50" cy="50" r="20" />
      </svg>
    </Base>
  );
}

const Base = styled("div", {
  base: {
    position: "relative",
    width: "100%",
    height: "100%",
    minWidth: "40px",
    minHeight: "40px",
  },
});

const spinner = cva({
  base: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "32px",
    height: "32px",
    // margins rather than a transform, which the rotation animates
    marginInlineStart: "-16px",
    marginTop: "-16px",
    animation: "spinnerRotate 1.4s linear infinite",

    "& circle": {
      fill: "none",
      stroke: "var(--md-sys-color-primary)",
      strokeWidth: 4,
      strokeLinecap: "round",
      animation: "spinnerDash 1.4s ease-in-out infinite",
    },
  },
});
