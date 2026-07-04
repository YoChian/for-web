import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
} from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { Server } from "stoat.js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { CONFIGURATION } from "@revolt/common";
import { useError } from "@revolt/i18n";
import {
  Button,
  Column,
  Dialog,
  DialogProps,
  FloatingSelect,
  MenuItem,
  Row,
  Slider,
  Text,
  TextField,
} from "@revolt/ui";

import { Modals } from "../types";

/** Output size of cropped emojis (server resizes to 128px anyway) */
const OUTPUT_SIZE = 128;
/** Size of the square editor viewport */
const EDITOR_SIZE = 296;

/**
 * Create a new server emoji with a Discord-like crop & zoom editor.
 *
 * - Static images can be repositioned/zoomed; the result is exported
 *   client-side at 128px to save bandwidth.
 * - GIFs are uploaded as-is (cropping would destroy animation), with a
 *   client-side size check against the instance limit.
 */
export function CreateEmojiModal(
  props: DialogProps & Modals & { type: "create_emoji" },
) {
  const { t } = useLingui();
  const err = useError();

  const [file, setFile] = createSignal<File | null>(null);
  const [objectUrl, setObjectUrl] = createSignal<string>();
  const [image, setImage] = createSignal<HTMLImageElement>();
  const [name, setName] = createSignal("");
  const [serverId, setServerId] = createSignal(props.server?.id ?? "");
  const [scale, setScale] = createSignal(1);
  const [offset, setOffset] = createSignal({ x: 0, y: 0 });
  const [pending, setPending] = createSignal(false);
  const [error, setError] = createSignal<unknown>();

  onCleanup(() => {
    const url = objectUrl();
    if (url) URL.revokeObjectURL(url);
  });

  const isGif = () => file()?.type === "image/gif";

  /** Servers the user can upload emojis to */
  const availableServers = createMemo(() =>
    props.server
      ? [props.server]
      : props.client.servers.filter((server: Server) =>
          server.havePermission("ManageCustomisation"),
        ),
  );

  const selectedServer = () =>
    availableServers().find((s) => s.id === serverId());

  /** Emoji upload size limit as advertised by the instance, if known */
  function emojiSizeLimit(): number | undefined {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const limits = (props.client.configuration as any)?.features?.limits;
      return (
        limits?.default?.file_upload_size_limits?.emojis ??
        limits?.default?.file_upload_size_limit?.emojis
      );
    } catch {
      return undefined;
    }
  }

  function pickFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.onchange = () => {
      const picked = input.files?.[0];
      if (!picked) return;

      setError(undefined);

      // reject oversized GIFs immediately: they are sent unmodified
      const limit = emojiSizeLimit();
      if (picked.type === "image/gif" && limit && picked.size > limit) {
        setError({ type: "FileTooLarge", max: limit });
        return;
      }

      const previous = objectUrl();
      if (previous) URL.revokeObjectURL(previous);

      const url = URL.createObjectURL(picked);
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setScale(1);
        setOffset({ x: 0, y: 0 });
      };
      img.src = url;

      setFile(picked);
      setObjectUrl(url);
      if (!name())
        setName(
          picked.name
            .replace(/\.[a-zA-Z0-9]+$/, "")
            .replaceAll(/[^a-zA-Z0-9_]/g, "_")
            .slice(0, 32),
        );
    };
    input.click();
  }

  /** Base (cover) scale so the image always fills the crop square */
  function coverScale(img: HTMLImageElement) {
    return EDITOR_SIZE / Math.min(img.naturalWidth, img.naturalHeight);
  }

  /** Clamp offset so no empty space is exposed inside the crop frame */
  function clampOffset(x: number, y: number) {
    const img = image();
    if (!img) return { x: 0, y: 0 };
    const s = coverScale(img) * scale();
    const maxX = Math.max(0, (img.naturalWidth * s - EDITOR_SIZE) / 2);
    const maxY = Math.max(0, (img.naturalHeight * s - EDITOR_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }

  // re-clamp when zooming out
  createEffect(() => {
    scale();
    setOffset((o) => clampOffset(o.x, o.y));
  });

  let dragFrom: { x: number; y: number; ox: number; oy: number } | null = null;

  function onPointerDown(event: PointerEvent) {
    const o = offset();
    dragFrom = { x: event.clientX, y: event.clientY, ox: o.x, oy: o.y };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent) {
    if (!dragFrom) return;
    setOffset(
      clampOffset(
        dragFrom.ox + (event.clientX - dragFrom.x),
        dragFrom.oy + (event.clientY - dragFrom.y),
      ),
    );
  }

  function onPointerUp() {
    dragFrom = null;
  }

  /** CSS transform of the image inside a given viewport size */
  function imageStyle(viewport: number) {
    const img = image();
    if (!img) return {};
    const ratio = viewport / EDITOR_SIZE;
    const s = coverScale(img) * scale() * ratio;
    const o = offset();
    return {
      width: `${img.naturalWidth * s}px`,
      height: `${img.naturalHeight * s}px`,
      transform: `translate(calc(-50% + ${o.x * ratio}px), calc(-50% + ${
        o.y * ratio
      }px))`,
    };
  }

  /** Draw the selected crop region onto a canvas and export it */
  function exportCrop(): Promise<Blob | null> {
    const img = image()!;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d")!;

    const s = coverScale(img) * scale();
    const o = offset();
    // top-left corner of the viewport in source-image coordinates
    const sx = (img.naturalWidth * s / 2 - o.x - EDITOR_SIZE / 2) / s;
    const sy = (img.naturalHeight * s / 2 - o.y - EDITOR_SIZE / 2) / s;

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      img,
      sx,
      sy,
      EDITOR_SIZE / s,
      EDITOR_SIZE / s,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    );

    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  const canSubmit = () =>
    !pending() && !!file() && !!selectedServer() && name().length >= 1;

  async function onSubmit() {
    if (!canSubmit()) return;
    setPending(true);
    setError(undefined);

    try {
      const payload = isGif() ? file()! : await exportCrop();
      if (!payload) throw { type: "ImageProcessingFailed" };

      const limit = emojiSizeLimit();
      if (limit && payload.size > limit)
        throw { type: "FileTooLarge", max: limit };

      const body = new FormData();
      body.append(
        "file",
        payload,
        isGif() ? file()!.name : `${name()}.png`,
      );

      const [key, value] = props.client.authenticationHeader;
      const res = await fetch(`${CONFIGURATION.DEFAULT_MEDIA_URL}/emojis`, {
        method: "POST",
        body,
        headers: { [key]: value },
      });

      // surface the actual error returned by the file server
      if (!res.ok)
        throw await res
          .json()
          .catch(() => ({ type: "InternalError" }));

      const data: { id: string } = await res.json();
      await selectedServer()!.createEmoji(data.id, { name: name() });

      props.onClose();
    } catch (error) {
      setError(error);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Add Emoji</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Create</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
          isDisabled: !canSubmit(),
        },
      ]}
      isDisabled={pending()}
    >
      <Layout>
        {/* editor viewport */}
        <Column align>
          <Switch
            fallback={
              <EditorFrame onClick={pickFile} data-empty>
                <Text class="label">
                  <Trans>Select an image</Trans>
                </Text>
              </EditorFrame>
            }
          >
            <Match when={file() && isGif()}>
              <EditorFrame onClick={pickFile}>
                <img
                  src={objectUrl()}
                  class={css({
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  })}
                />
              </EditorFrame>
              <Text class="label" size="small">
                <Trans>GIFs are uploaded as-is, without cropping.</Trans>
              </Text>
            </Match>
            <Match when={file() && !isGif()}>
              <EditorFrame
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                class={css({ cursor: "grab", touchAction: "none" })}
              >
                <img src={objectUrl()} style={imageStyle(EDITOR_SIZE)} />
                <CropOverlay />
              </EditorFrame>
              <Text class="label" size="small">
                <Trans>Drag the image to adjust its position</Trans>
              </Text>
              <Slider
                min={1}
                max={4}
                step={0.01}
                value={scale()}
                onInput={(e) => setScale(e.currentTarget.value)}
                labelFormatter={(v) => `${Math.round(v * 100)}%`}
              />
            </Match>
          </Switch>
        </Column>

        {/* controls */}
        <Column gap="lg">
          <Show when={file() && !isGif()}>
            <Column gap="sm">
              <Text class="label">
                <Trans>Preview</Trans>
              </Text>
              <Row align gap="lg">
                <PreviewBox size={32}>
                  <img src={objectUrl()} style={imageStyle(32)} />
                </PreviewBox>
                <PreviewBox size={96}>
                  <img src={objectUrl()} style={imageStyle(96)} />
                </PreviewBox>
              </Row>
            </Column>
          </Show>

          <TextField
            required
            value={name()}
            label={t`Emoji Name`}
            placeholder="my_emoji"
            onInput={(e) =>
              setName(
                e.currentTarget.value.replaceAll(/[^a-zA-Z0-9_]/g, "_"),
              )
            }
          />

          <Show when={!props.server}>
            <FloatingSelect
              label={t`Upload to`}
              value={serverId()}
              onChange={(e) => setServerId(e.currentTarget.value as string)}
            >
              <For each={availableServers()}>
                {(server) => <MenuItem value={server.id}>{server.name}</MenuItem>}
              </For>
            </FloatingSelect>
          </Show>

          <Show when={file()}>
            <Button variant="text" size="small" onPress={pickFile}>
              <Trans>Choose a different image</Trans>
            </Button>
          </Show>

          <Show when={error()}>
            <div class={css({ color: "var(--md-sys-color-error)" })}>
              <Text class="label">{err(error())}</Text>
            </div>
          </Show>
        </Column>
      </Layout>
    </Dialog>
  );
}

const Layout = styled("div", {
  base: {
    display: "flex",
    gap: "var(--gap-lg)",
    flexWrap: "wrap",
    justifyContent: "center",
  },
});

const EditorFrame = styled("div", {
  base: {
    position: "relative",
    width: `${EDITOR_SIZE}px`,
    height: `${EDITOR_SIZE}px`,
    overflow: "hidden",
    borderRadius: "var(--borderRadius-md)",
    background:
      "repeating-conic-gradient(var(--md-sys-color-surface-container-high) 0% 25%, transparent 0% 50%) 50% / 20px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,

    "& img": {
      position: "absolute",
      left: "50%",
      top: "50%",
      maxWidth: "none",
      userSelect: "none",
      pointerEvents: "none",
    },

    "&[data-empty]": {
      cursor: "pointer",
      border: "2px dashed var(--md-sys-color-outline)",
    },
  },
});

const CropOverlay = styled("div", {
  base: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    border: "2px solid var(--md-sys-color-outline)",
    borderRadius: "var(--borderRadius-md)",
  },
});

function PreviewBox(props: { size: number; children?: never[] | unknown }) {
  return (
    <div
      class={css({
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--borderRadius-sm)",
        flexShrink: 0,

        "& img": {
          position: "absolute",
          left: "50%",
          top: "50%",
          maxWidth: "none",
          userSelect: "none",
          pointerEvents: "none",
        },
      })}
      style={{ width: `${props.size}px`, height: `${props.size}px` }}
    >
      {props.children as never}
    </div>
  );
}
