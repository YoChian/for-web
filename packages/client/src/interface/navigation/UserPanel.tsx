import { Show, createSignal } from "solid-js";

import { useLingui } from "@lingui/solid/macro";
import { cva } from "styled-system/css";

import { useUser } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { useVoice } from "@revolt/rtc";
import { Avatar, OverflowingText, UserStatus } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { UserMenu } from "./servers/UserMenu";

/**
 * Discord-like user panel under the channel sidebar (fork customization)
 *
 * Shows the current user with their status, and the microphone, deafen and
 * settings buttons. The status menu opens from the account area.
 */
export function UserPanel() {
  const { t } = useLingui();
  const user = useUser();
  const voice = useVoice();
  const { openModal } = useModals();
  const [account, setAccount] = createSignal<HTMLDivElement>();

  const inCall = () => !!voice.room();

  /**
   * Custom status if set, otherwise the presence
   */
  const status = () => {
    const current = user();
    if (current?.status?.text) return current.status.text;

    switch (current?.presence) {
      case "Online":
        return t`Online`;
      case "Busy":
        return t`Busy`;
      case "Focus":
        return t`Focus`;
      case "Idle":
        return t`Idle`;
      default:
        return t`Invisible`;
    }
  };

  return (
    <div class={panel()}>
      <div ref={setAccount} class={accountButton()}>
        <Avatar
          size={32}
          src={user()?.animatedAvatarURL}
          fallback={user()?.displayName}
          holepunch="bottom-right"
          overlay={<UserStatus.Graphic status={user()?.presence} />}
        />
        <div class={names()}>
          <OverflowingText class={displayName()}>
            {user()?.displayName}
          </OverflowingText>
          <OverflowingText class={statusLine()}>{status()}</OverflowingText>
        </div>
      </div>
      <UserMenu anchor={account} placement="top-start" />

      <button
        type="button"
        class={action({ off: !voice.microphone() })}
        onClick={() => voice.toggleMute()}
        disabled={inCall() && !voice.speakingPermission}
        aria-label={voice.microphone() ? t`Mute` : t`Unmute`}
        use:floating={{
          tooltip: {
            placement: "top",
            content: voice.microphone() ? t`Mute` : t`Unmute`,
          },
        }}
      >
        <Show when={voice.microphone()} fallback={<Symbol>mic_off</Symbol>}>
          <Symbol>mic</Symbol>
        </Show>
      </button>
      <button
        type="button"
        class={action({ off: voice.deafen() })}
        onClick={() => voice.toggleDeafen()}
        disabled={inCall() && !voice.listenPermission}
        aria-label={voice.deafen() ? t`Undeafen` : t`Deafen`}
        use:floating={{
          tooltip: {
            placement: "top",
            content: voice.deafen() ? t`Undeafen` : t`Deafen`,
          },
        }}
      >
        <Show when={voice.deafen()} fallback={<Symbol>headset</Symbol>}>
          <Symbol>headset_off</Symbol>
        </Show>
      </button>
      <button
        type="button"
        class={action()}
        onClick={() => openModal({ type: "settings", config: "user" })}
        aria-label={t`User Settings`}
        use:floating={{
          tooltip: {
            placement: "top",
            content: t`User Settings`,
          },
        }}
      >
        <Symbol fill>settings</Symbol>
      </button>
    </div>
  );
}

const panel = cva({
  base: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: "2px",
    height: "52px",
    paddingInline: "8px",
    background: "var(--surface-panel)",
    color: "var(--md-sys-color-on-surface)",
    userSelect: "none",
  },
});

const accountButton = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-md)",
    flexGrow: 1,
    minWidth: 0,
    padding: "4px 8px 4px 2px",
    marginInlineStart: "-2px",
    borderRadius: "var(--borderRadius-sm)",
    cursor: "pointer",
    transition: "var(--transitions-fast) background",

    "&:hover": {
      background:
        "color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)",
    },
  },
});

const names = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    lineHeight: "18px",
  },
});

const displayName = cva({
  base: {
    fontSize: "14px",
    fontWeight: 600,
  },
});

const statusLine = cva({
  base: {
    fontSize: "12px",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

const action = cva({
  base: {
    flexShrink: 0,
    display: "grid",
    placeItems: "center",
    width: "32px",
    height: "32px",
    padding: 0,
    border: "none",
    borderRadius: "var(--borderRadius-sm)",
    background: "transparent",
    color: "var(--md-sys-color-on-surface-variant)",
    cursor: "pointer",
    transition:
      "var(--transitions-fast) background, var(--transitions-fast) color",

    "&:hover": {
      color: "var(--md-sys-color-on-surface)",
      background:
        "color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)",
    },

    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.45,
    },
  },
  variants: {
    // muted microphone or deafened, red like Discord
    off: {
      true: {
        color: "var(--md-sys-color-error)",

        "&:hover": {
          color: "var(--md-sys-color-error)",
        },
      },
    },
  },
});
