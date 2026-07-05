import { For, Show, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import MdDelete from "@material-design-icons/svg/outlined/delete.svg?component-solid";
import MdEdit from "@material-design-icons/svg/outlined/edit.svg?component-solid";
import { Emoji, Server } from "stoat.js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { CONFIGURATION } from "@revolt/common";
import { useModals } from "@revolt/modal";
import { Avatar, Button, Column, IconButton, Row, Text } from "@revolt/ui";

/**
 * Emoji list
 */
export function EmojiList(props: { server: Server }) {
  const { t } = useLingui();
  const client = useClient();
  const { openModal, showError } = useModals();

  // id of the emoji currently being renamed
  const [editingId, setEditingId] = createSignal<string>();
  // local display-name overrides (cache does not update on rename)
  const [renamed, setRenamed] = createSignal<Record<string, string>>({});

  const slotsRemaining = () =>
    CONFIGURATION.MAX_EMOJI - props.server.emojis.length;

  const displayName = (emoji: Emoji) => renamed()[emoji.id] ?? emoji.name;

  /** Entry point: pick a file first, then open the editor */
  function uploadEmoji() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file)
        openModal({
          type: "create_emoji",
          client: client(),
          server: props.server,
          file,
        });
    };
    input.click();
  }

  /** Re-crop an existing emoji (downloads the current image) */
  async function editEmoji(emoji: Emoji) {
    try {
      const blob = await fetch(emoji.url!).then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.blob();
      });

      openModal({
        type: "create_emoji",
        client: client(),
        server: props.server,
        file: new File([blob], `${displayName(emoji)}.png`, {
          type: blob.type,
        }),
        replace: emoji,
      });
    } catch (error) {
      showError(error);
    }
  }

  /** Persist a rename through the raw API (SDK lacks a wrapper) */
  async function renameEmoji(emoji: Emoji, name: string) {
    setEditingId(undefined);
    const cleaned = name.replaceAll(/[^a-zA-Z0-9_]/g, "_").slice(0, 32);
    if (!cleaned || cleaned === displayName(emoji)) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client().api as any).patch(`/custom/emoji/${emoji.id}`, {
        name: cleaned,
      });
      setRenamed((existing) => ({ ...existing, [emoji.id]: cleaned }));
    } catch (error) {
      showError(error);
    }
  }

  return (
    <Column gap="lg">
      <Row align>
        <Button onPress={uploadEmoji} isDisabled={slotsRemaining() <= 0}>
          <Trans>Upload Emoji</Trans>
        </Button>
        <Text class="label">
          <Trans>{slotsRemaining()} emoji slots remaining</Trans>
        </Text>
      </Row>

      <Column gap="sm">
        <For
          each={props.server.emojis.toSorted((b, a) =>
            a.id.localeCompare(b.id),
          )}
        >
          {(emoji) => (
            <EmojiRow>
              <a onClick={() => openModal({ type: "emoji_preview", emoji })}>
                <Avatar src={emoji.url} shape="rounded-square" size={40} />
              </a>

              <Column gap="none" grow>
                <Show
                  when={editingId() === emoji.id}
                  fallback={
                    <NameButton
                      title={t`Click to rename`}
                      onClick={() => setEditingId(emoji.id)}
                    >
                      :{displayName(emoji)}:
                    </NameButton>
                  }
                >
                  <NameInput
                    autofocus
                    value={displayName(emoji)}
                    onBlur={(e) => renameEmoji(emoji, e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        renameEmoji(emoji, e.currentTarget.value);
                      else if (e.key === "Escape") setEditingId(undefined);
                    }}
                  />
                </Show>
                <span
                  class={css({
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--gap-sm)",
                  })}
                >
                  <Avatar
                    size={12}
                    fallback={emoji.creator?.displayName}
                    src={emoji.creator?.animatedAvatarURL}
                  />
                  <Text class="label">{emoji.creator?.displayName}</Text>
                </span>
              </Column>

              <div class="actions">
                <IconButton
                  size="sm"
                  onPress={() => editEmoji(emoji)}
                  aria-label={t`Edit emoji`}
                >
                  <MdEdit />
                </IconButton>
                <IconButton
                  size="sm"
                  onPress={() => openModal({ type: "delete_emoji", emoji })}
                  aria-label={t`Delete emoji`}
                >
                  <MdDelete />
                </IconButton>
              </div>
            </EmojiRow>
          )}
        </For>
      </Column>
    </Column>
  );
}

const EmojiRow = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-md)",
    padding: "var(--gap-sm) var(--gap-md)",
    borderRadius: "var(--borderRadius-md)",
    transition: "var(--transitions-fast) background",

    "& .actions": {
      display: "flex",
      gap: "var(--gap-sm)",
      opacity: 0,
      transition: "var(--transitions-fast) opacity",
    },

    "&:hover": {
      background: "var(--md-sys-color-surface-container-low)",

      "& .actions": {
        opacity: 1,
      },
    },

    "& > a": {
      cursor: "pointer",
      flexShrink: 0,
    },
  },
});

const NameButton = styled("button", {
  base: {
    all: "unset",
    cursor: "text",
    textAlign: "left",
    fontWeight: 500,
    width: "fit-content",

    "&:hover": {
      textDecoration: "underline dashed",
      textUnderlineOffset: "3px",
    },
  },
});

const NameInput = styled("input", {
  base: {
    all: "unset",
    fontWeight: 500,
    borderBottom: "1px solid var(--md-sys-color-primary)",
    width: "160px",
  },
});
