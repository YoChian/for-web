import type { Accessor, JSX, Setter } from "solid-js";
import {
  Show,
  createContext,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";
import { Portal } from "solid-js/web";
import { Motion, Presence } from "solid-motionone";

import { useLingui } from "@lingui/solid/macro";
import { cva } from "styled-system/css";

import { Symbol } from "../utils/Symbol";

export type SnackbarItem = {
  id: string;
  message: string;
  action?: string;
  closeable?: boolean;
  autoCloseDelay?: number;
  messageLine?: 1 | 2;
  placement?:
    | "top"
    | "top-start"
    | "top-end"
    | "bottom"
    | "bottom-start"
    | "bottom-end";
  onAction?: () => void;
  onClose?: () => void;
  closeOnAction?: boolean;
};

export type ShowSnackbarOptions = Omit<SnackbarItem, "id"> & {
  /**
   * Immediately replace the currently visible snackbar instead of queuing.
   * Use when the new message supersedes outdated information already on screen.
   */
  replaceActive?: boolean;
};

/**
 * Manages a queue of active snackbars
 */
export class SnackbarController {
  items: Accessor<SnackbarItem[]>;
  setItems: Setter<SnackbarItem[]>;

  constructor() {
    const [items, setItems] = createSignal<SnackbarItem[]>([]);
    this.items = items;
    this.setItems = setItems;

    this.show = this.show.bind(this);
    this.dismiss = this.dismiss.bind(this);
  }

  /**
   * Push a new snackbar onto the queue, or immediately replace the active one.
   * Snackbars with an action default to no auto-close; without an action they
   * default to 5 seconds.
   * @returns The id of the new snackbar
   */
  show(opts: ShowSnackbarOptions): string {
    const { replaceActive, ...rest } = opts;
    const id = Math.random().toString(36).slice(2);
    const autoCloseDelay = rest.autoCloseDelay ?? (rest.action ? 0 : 5000);
    const item: SnackbarItem = { ...rest, id, autoCloseDelay };

    if (replaceActive) {
      this.setItems((items) => [item, ...items.slice(1)]);
    } else {
      this.setItems((items) => [...items, item]);
    }

    return id;
  }

  /**
   * Remove a snackbar by id
   */
  dismiss(id: string): void {
    this.setItems((items) => items.filter((item) => item.id !== id));
  }
}

export const SnackbarContext = createContext<SnackbarController>();

/**
 * Access the nearest SnackbarController
 */
export function useSnackbar(): SnackbarController {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error("useSnackbar must be used inside SnackbarProvider");
  return ctx;
}

type ProviderProps = {
  controller: SnackbarController;
  children: JSX.Element;
};

/**
 * Provides snackbar context and renders the active snackbar into the floating portal.
 *
 * Bottom placements are lifted by the CSS custom property
 * `--snackbar-offset-bottom` (80px by default, clear of the chatbar):
 *
 * ```css
 * :root { --snackbar-offset-bottom: 80px; }
 * ```
 */
export function SnackbarProvider(props: ProviderProps) {
  return (
    <SnackbarContext.Provider value={props.controller}>
      {props.children}
      <Portal mount={document.getElementById("floating")!}>
        <Presence exitBeforeEnter>
          <Show when={props.controller.items()[0]} keyed>
            {(item) => (
              <Snackbar
                {...item}
                onClose={() => {
                  item.onClose?.();
                  props.controller.dismiss(item.id);
                }}
                onAction={() => item.onAction?.()}
              />
            )}
          </Show>
        </Presence>
      </Portal>
    </SnackbarContext.Provider>
  );
}

type SnackbarProps = SnackbarItem & {
  onClose: () => void;
  onAction: () => void;
};

/**
 * Snackbars provide brief, non-intrusive feedback about an operation.
 *
 * @library Discord-like skin (fork customization)
 */
function Snackbar(props: SnackbarProps) {
  const { t } = useLingui();
  const placement = () => props.placement ?? "bottom";
  const fromTop = () => placement().startsWith("top");

  onMount(() => {
    if (!props.autoCloseDelay) return;
    const timer = setTimeout(props.onClose, props.autoCloseDelay);
    onCleanup(() => clearTimeout(timer));
  });

  return (
    <Motion.div
      class={snackbar({ placement: placement() })}
      role="status"
      initial={{ opacity: 0, y: fromTop() ? -16 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: fromTop() ? -16 : 16 }}
      transition={{ duration: 0.2, easing: [0.05, 0.7, 0.1, 1] }}
    >
      <span class={message({ lines: props.messageLine })}>{props.message}</span>
      <Show when={props.action}>
        <button
          type="button"
          class={action()}
          onClick={() => {
            props.onAction();
            if (props.closeOnAction) props.onClose();
          }}
        >
          {props.action}
        </button>
      </Show>
      <Show when={props.closeable}>
        <button
          type="button"
          class={close()}
          aria-label={t`Close`}
          onClick={() => props.onClose()}
        >
          <Symbol size={20}>close</Symbol>
        </button>
      </Show>
    </Motion.div>
  );
}

const snackbar = cva({
  base: {
    position: "fixed",
    zIndex: 1100,
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-l)",
    width: "max-content",
    minWidth: "min(320px, calc(100vw - 32px))",
    maxWidth: "min(560px, calc(100vw - 32px))",
    paddingBlock: "10px",
    paddingInline: "16px 10px",
    borderRadius: "var(--borderRadius-lg)",
    background: "var(--md-sys-color-inverse-surface)",
    color: "var(--md-sys-color-inverse-on-surface)",
    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.24)",
    fontSize: "14px",
    lineHeight: "20px",
  },
  variants: {
    // centred with margins: the enter animation owns `transform`
    placement: {
      top: { top: "16px", insetInline: 0, marginInline: "auto" },
      "top-start": { top: "16px", insetInlineStart: "16px" },
      "top-end": { top: "16px", insetInlineEnd: "16px" },
      bottom: {
        bottom: "16px",
        insetInline: 0,
        marginInline: "auto",
        translate: "0 calc(-1 * var(--snackbar-offset-bottom, 80px))",
      },
      "bottom-start": {
        bottom: "16px",
        insetInlineStart: "16px",
        translate: "0 calc(-1 * var(--snackbar-offset-bottom, 80px))",
      },
      "bottom-end": {
        bottom: "16px",
        insetInlineEnd: "16px",
        translate: "0 calc(-1 * var(--snackbar-offset-bottom, 80px))",
      },
    },
  },
});

const message = cva({
  base: {
    flexGrow: 1,
    minWidth: 0,
    overflowWrap: "anywhere",
  },
  variants: {
    lines: {
      1: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
      2: {
        display: "-webkit-box",
        overflow: "hidden",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
      },
    },
  },
});

const action = cva({
  base: {
    flexShrink: 0,
    paddingBlock: "6px",
    paddingInline: "12px",
    border: "none",
    borderRadius: "var(--borderRadius-sm)",
    background: "var(--md-sys-color-primary)",
    color: "var(--md-sys-color-on-primary)",
    fontFamily: "inherit",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",

    "&:hover": {
      background: "color-mix(in srgb, var(--md-sys-color-primary) 85%, black)",
    },
  },
});

const close = cva({
  base: {
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    width: "28px",
    height: "28px",
    padding: 0,
    border: "none",
    borderRadius: "var(--borderRadius-sm)",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    opacity: 0.7,

    "&:hover": {
      opacity: 1,
    },
  },
});
