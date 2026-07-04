import { For } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { Server } from "stoat.js";
import { css } from "styled-system/css";

import { useClient } from "@revolt/client";
import { CONFIGURATION } from "@revolt/common";
import { useModals } from "@revolt/modal";
import { Avatar, Button, CategoryButton, Column, Row, Text } from "@revolt/ui";

/**
 * Emoji list
 */
export function EmojiList(props: { server: Server }) {
  const client = useClient();
  const { openModal } = useModals();

  const slotsRemaining = () =>
    CONFIGURATION.MAX_EMOJI - props.server.emojis.length;

  return (
    <Column gap="lg">
      <Row align>
        <Button
          onPress={() =>
            openModal({
              type: "create_emoji",
              client: client(),
              server: props.server,
            })
          }
          isDisabled={slotsRemaining() <= 0}
        >
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
            <CategoryButton
              roundedIcon={false}
              icon={<Avatar src={emoji.url} shape="rounded-square" />}
              onClick={() => openModal({ type: "emoji_preview", emoji })}
            >
              <Column gap="none">
                <span class={css({ flex: 1 })}>:{emoji.name}:</span>
                <span
                  class={css({
                    flex: 1,
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
            </CategoryButton>
          )}
        </For>
      </Column>
    </Column>
  );
}
