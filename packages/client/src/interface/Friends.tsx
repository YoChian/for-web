import {
  Accessor,
  JSX,
  Show,
  createMemo,
  createSignal,
  splitProps,
} from "solid-js";

import { Tabs } from "@ark-ui/solid";
import { Trans, useLingui } from "@lingui/solid/macro";
import { VirtualContainer } from "@minht11/solid-virtual-container";
import type { User } from "stoat.js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { UserContextMenu } from "@revolt/app";
import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import {
  Avatar,
  Badge,
  Deferred,
  Header,
  IconButton,
  List,
  ListItem,
  ListSubheader,
  OverflowingText,
  UserStatus,
  main,
} from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { HeaderIcon } from "./common/CommonHeader";

/**
 * Base layout of the friends page
 */
const base = cva({
  base: {
    width: "100%",
    display: "flex",
    flexDirection: "column",

    "& .FriendsList": {
      height: "100%",
      paddingInline: "var(--gap-lg)",
    },
  },
});

/**
 * Divider between the title and the tabs
 */
const divider = cva({
  base: {
    flexShrink: 0,
    width: "1px",
    height: "24px",
    background: "var(--md-sys-color-outline-variant)",
  },
});

/**
 * Discord-like tab bar in the header (fork customization)
 */
const tabList = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-sm)",
    flexGrow: 1,
    minWidth: 0,
    overflowX: "auto",
    scrollbarWidth: "none",
  },
});

const tab = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    flexShrink: 0,
    paddingBlock: "2px",
    paddingInline: "8px",
    border: "none",
    borderRadius: "var(--borderRadius-sm)",
    background: "transparent",
    color: "var(--md-sys-color-on-surface-variant)",
    fontFamily: "inherit",
    fontSize: "15px",
    fontWeight: 500,
    lineHeight: "24px",
    whiteSpace: "nowrap",
    cursor: "pointer",
    outline: "none",
    transition:
      "var(--transitions-fast) background, var(--transitions-fast) color",

    "&:hover": {
      color: "var(--md-sys-color-on-surface)",
      background:
        "color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)",
    },

    "&[data-selected]": {
      color: "var(--md-sys-color-on-secondary-container)",
      background: "var(--md-sys-color-secondary-container)",
    },

    "&:focus-visible": {
      boxShadow: "inset 0 0 0 2px var(--md-sys-color-primary)",
    },
  },
});

/**
 * Friends menu
 */
export function Friends() {
  const { t } = useLingui();
  const client = useClient();
  const { openModal } = useModals();

  /**
   * Reference to the parent scroll container
   */
  let scrollTargetElement!: HTMLDivElement;

  /**
   * Signal required for reacting to ref changes
   */
  const targetSignal = () => scrollTargetElement;

  /**
   * Generate lists of all users
   */
  const lists = createMemo(() => {
    const list = client()!.users.toList();

    const friends = list
      .filter((user) => user.relationship === "Friend")
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    return {
      friends,
      online: friends.filter((user) => user.online),
      incoming: list
        .filter((user) => user.relationship === "Incoming")
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
      outgoing: list
        .filter((user) => user.relationship === "Outgoing")
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
      blocked: list
        .filter((user) => user.relationship === "Blocked")
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    };
  });

  const pending = () => {
    const incoming = lists().incoming;
    return incoming.length > 99 ? "99+" : incoming.length;
  };

  const [page, setPage] = createSignal("online");

  return (
    <Tabs.Root
      class={base()}
      value={page()}
      onValueChange={(details) => setPage(details.value)}
      lazyMount
      unmountOnExit
    >
      <Header placement="primary">
        <HeaderIcon>
          <Symbol>group</Symbol>
        </HeaderIcon>
        <Trans>Friends</Trans>
        <div class={divider()} />
        <Tabs.List class={tabList()}>
          <Tabs.Trigger value="online" class={tab()}>
            <Trans>Online</Trans>
          </Tabs.Trigger>
          <Tabs.Trigger value="all" class={tab()}>
            <Trans>All</Trans>
          </Tabs.Trigger>
          <Tabs.Trigger value="pending" class={tab()}>
            <Trans>Pending</Trans>
            <Show when={pending()}>
              <Badge variant="large">{pending()}</Badge>
            </Show>
          </Tabs.Trigger>
          <Tabs.Trigger value="blocked" class={tab()}>
            <Trans>Blocked</Trans>
          </Tabs.Trigger>
        </Tabs.List>
        <IconButton
          variant="filled"
          size="xs"
          onPress={() =>
            openModal({
              type: "add_friend",
              client: client(),
            })
          }
          use:floating={{
            tooltip: {
              placement: "bottom",
              content: t`Add a new friend`,
            },
          }}
        >
          <Symbol>person_add</Symbol>
        </IconButton>
      </Header>

      <main class={main()}>
        <div
          style={{
            position: "relative",
            "min-height": 0,
          }}
        >
          <Deferred>
            <div class="FriendsList" ref={scrollTargetElement} use:scrollable>
              <Tabs.Content value="online">
                <People
                  title={t`Online`}
                  users={lists().online}
                  scrollTargetElement={targetSignal}
                />
              </Tabs.Content>
              <Tabs.Content value="all">
                <People
                  title={t`All`}
                  users={lists().friends}
                  scrollTargetElement={targetSignal}
                />
              </Tabs.Content>
              <Tabs.Content value="pending">
                <People
                  title={t`Incoming`}
                  users={lists().incoming}
                  scrollTargetElement={targetSignal}
                />
                <People
                  title={t`Outgoing`}
                  users={lists().outgoing}
                  scrollTargetElement={targetSignal}
                />
              </Tabs.Content>
              <Tabs.Content value="blocked">
                <People
                  title={t`Blocked`}
                  users={lists().blocked}
                  scrollTargetElement={targetSignal}
                />
              </Tabs.Content>
            </div>
          </Deferred>
        </div>
      </main>
    </Tabs.Root>
  );
}

/**
 * List of users
 */
function People(props: {
  users: User[];
  title: string;
  scrollTargetElement: Accessor<HTMLDivElement>;
}) {
  return (
    <List>
      <ListSubheader>
        {props.title} {"–"} {props.users.length}
      </ListSubheader>

      <Show when={props.users.length === 0}>
        <ListItem disabled>
          <Trans>Nobody here right now!</Trans>
        </ListItem>
      </Show>

      <VirtualContainer
        items={props.users}
        scrollTarget={props.scrollTargetElement()}
        itemSize={{ height: 58 }}
        // grid rendering:
        // itemSize={{ height: 60, width: 240 }}
        // crossAxisCount={(measurements) =>
        //   Math.floor(measurements.container.cross / measurements.itemSize.cross)
        // }
        // width: 100% needs to be removed from listentry below for this to work ^^^
      >
        {(item) => (
          <ContainerListEntry
            style={{
              ...item.style,
            }}
          >
            <Entry
              role="listitem"
              tabIndex={item.tabIndex}
              style={item.style}
              user={item.item}
            />
          </ContainerListEntry>
        )}
      </VirtualContainer>
    </List>
  );
}

const ContainerListEntry = styled("div", {
  base: {
    width: "100%",
  },
});

/**
 * Single user entry
 */
function Entry(
  props: { user: User } & Omit<
    JSX.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >,
) {
  const { openModal } = useModals();
  const [local, remote] = splitProps(props, ["user"]);

  return (
    <a
      {...remote}
      use:floating={{
        contextMenu: () => <UserContextMenu user={local.user} />,
      }}
      onClick={() => openModal({ type: "user_profile", user: local.user })}
    >
      <ListItem>
        <Avatar
          slot="icon"
          size={36}
          src={local.user.animatedAvatarURL}
          holepunch={
            props.user.relationship === "Friend" ? "bottom-right" : "none"
          }
          overlay={
            <Show when={props.user.relationship === "Friend"}>
              <UserStatus.Graphic
                status={props.user.status?.presence ?? "Online"}
              />
            </Show>
          }
        />
        <OverflowingText>{local.user.displayName}</OverflowingText>
      </ListItem>
    </a>
  );
}
