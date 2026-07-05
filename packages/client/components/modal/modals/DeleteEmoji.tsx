import { Trans } from "@lingui-solid/solid/macro";

import { Avatar, Dialog, DialogProps, Row, Text } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Confirm deletion of a server emoji
 */
export function DeleteEmojiModal(
  props: DialogProps & Modals & { type: "delete_emoji" },
) {
  const { showError } = useModals();

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Delete this emoji?</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Delete</Trans>,
          onClick: () => {
            props.emoji.delete().catch(showError);
            return true;
          },
        },
      ]}
    >
      <Row align gap="lg">
        <Avatar src={props.emoji.url} shape="rounded-square" size={48} />
        <Text>:{props.emoji.name}:</Text>
      </Row>
      <Text class="label">
        <Trans>
          Messages using this emoji will no longer be able to display it.
        </Trans>
      </Text>
    </Dialog>
  );
}
