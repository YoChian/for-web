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
import MdFlip from "@material-design-icons/svg/outlined/flip.svg?component-solid";
import MdRestartAlt from "@material-design-icons/svg/outlined/restart_alt.svg?component-solid";
import MdZoomIn from "@material-design-icons/svg/outlined/zoom_in.svg?component-solid";
import MdZoomOut from "@material-design-icons/svg/outlined/zoom_out.svg?component-solid";
import { Server } from "stoat.js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { CONFIGURATION } from "@revolt/common";
import { useError } from "@revolt/i18n";
import {
  Column,
  Dialog,
  DialogProps,
  FloatingSelect,
  IconButton,
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
const EDITOR_SIZE = 280;

/**
 * Create (or re-crop) a server emoji with a Discord-like editor:
 * drag to position, zoom & rotation sliders, flip buttons and reset.
 *
 * Static images are exported client-side at 128px to save bandwidth.
 * GIFs are uploaded as-is (cropping would destroy animation).
 */
export function CreateEmojiModal(
  props: DialogProps & Modals & { type: "create_emoji" },
) {
  const { t } = useLingui();
  const err = useError();

  const [file, setFile] = createSignal<File | null>(props.file ?? null);
  const [objectUrl, setObjectUrl] = createSignal<string>();
  const [image, setImage] = createSignal<HTMLImageElement>();
  const [name, setName] = createSignal(
    props.replace?.name ?? suggestName(props.file),
  );
  const [serverId, setServerId] = createSignal(props.server?.id ?? "");
  const [zoom, setZoom] = createSignal(1);
  const [rotation, setRotation] = createSignal(0);
  const [flipH, setFlipH] = createSignal(false);
  const [flipV, setFlipV] = createSignal(false);
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

  // always have a sensible default target server
  createEffect(() => {
    if (!selectedServer() && availableServers().length) {
      setServerId(availableServers()[0].id);
    }
  });

  const slotsRemaining = () => {
    const server = selectedServer();
    return server
      ? CONFIGURATION.MAX_EMOJI - server.emojis.length
      : undefined;
  };

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

  function loadFile(picked: File) {
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
      resetTransform();
    };
    img.src = url;

    setFile(picked);
    setObjectUrl(url);
    if (!name()) setName(suggestName(picked));
  }

  // load the file handed over by the entry point
  if (props.file) loadFile(props.file);

  function pickFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/gif";
    input.onchange = () => {
      const picked = input.files?.[0];
      if (picked) loadFile(picked);
    };
    input.click();
  }

  function resetTransform() {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setOffset({ x: 0, y: 0 });
  }

  /** Base (cover) scale so the image initially fills the crop square */
  function coverScale(img: HTMLImageElement) {
    return EDITOR_SIZE / Math.min(img.naturalWidth, img.naturalHeight);
  }

  /** Loose panning bound (rotation makes exact clamping unrewarding) */
  function clampOffset(x: number, y: number) {
    const img = image();
    if (!img) return { x: 0, y: 0 };
    const s = coverScale(img) * zoom();
    const bound =
      (Math.hypot(img.naturalWidth, img.naturalHeight) * s) / 2;
    return {
      x: Math.min(bound, Math.max(-bound, x)),
      y: Math.min(bound, Math.max(-bound, y)),
    };
  }

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

  /** CSS transform of the image inside a viewport of given size */
  function imageStyle(viewport: number) {
    const img = image();
    if (!img) return {};
    const ratio = viewport / EDITOR_SIZE;
    const s = coverScale(img) * zoom() * ratio;
    const o = offset();
    return {
      width: `${img.naturalWidth}px`,
      transform:
        `translate(-50%, -50%) ` +
        `translate(${o.x * ratio}px, ${o.y * ratio}px) ` +
        `rotate(${rotation()}deg) ` +
        `scale(${s * (flipH() ? -1 : 1)}, ${s * (flipV() ? -1 : 1)})`,
    };
  }

  /** Draw the selected crop region onto a canvas and export it */
  function exportCrop(): Promise<Blob | null> {
    const img = image()!;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d")!;
    const outRatio = OUTPUT_SIZE / EDITOR_SIZE;
    const s = coverScale(img) * zoom();
    const o = offset();

    ctx.imageSmoothingQuality = "high";
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
    ctx.scale(outRatio, outRatio);
    ctx.translate(o.x, o.y);
    ctx.rotate((rotation() * Math.PI) / 180);
    ctx.scale(s * (flipH() ? -1 : 1), s * (flipV() ? -1 : 1));
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

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
      body.append("file", payload, isGif() ? file()!.name : `${name()}.png`);

      const [key, value] = props.client.authenticationHeader;
      const res = await fetch(`${CONFIGURATION.DEFAULT_MEDIA_URL}/emojis`, {
        method: "POST",
        body,
        headers: { [key]: value },
      });

      // surface the actual error returned by the file server
      if (!res.ok)
        throw await res.json().catch(() => ({ type: "InternalError" }));

      const data: { id: string } = await res.json();
      await selectedServer()!.createEmoji(data.id, { name: name() });

      // when re-cropping an existing emoji, replace it
      if (props.replace) await props.replace.delete().catch(() => void 0);

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
          text: props.replace ? <Trans>Save</Trans> : <Trans>Create</Trans>,
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
        {/* left: editor viewport & transform controls */}
        <Column align gap="sm">
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
                <ResetHolder>
                  <IconButton
                    size="sm"
                    onPress={resetTransform}
                    aria-label={t`Reset adjustments`}
                  >
                    <MdRestartAlt />
                  </IconButton>
                </ResetHolder>
              </EditorFrame>
              <Text class="label" size="small">
                <Trans>Drag the image to adjust its position</Trans>
              </Text>

              {/* flip + zoom row, Discord-style */}
              <Row align gap="sm" class={css({ width: "100%" })}>
                <IconButton
                  size="sm"
                  onPress={() => setFlipH((v) => !v)}
                  aria-label={t`Flip horizontally`}
                >
                  <MdFlip />
                </IconButton>
                <IconButton
                  size="sm"
                  onPress={() => setFlipV((v) => !v)}
                  aria-label={t`Flip vertically`}
                >
                  <MdFlip class={css({ transform: "rotate(90deg)" })} />
                </IconButton>
                <MdZoomOut />
                <div class={css({ flexGrow: 1 })}>
                  <Slider
                    min={1}
                    max={4}
                    step={0.01}
                    value={zoom()}
                    onInput={(e) => setZoom(e.currentTarget.value)}
                    labelFormatter={(v) => `${Math.round(v * 100)}%`}
                  />
                </div>
                <MdZoomIn />
              </Row>

              {/* rotation row */}
              <Row align gap="sm" class={css({ width: "100%" })}>
                <Text class="label">
                  <Trans>Rotation</Trans>
                </Text>
                <div class={css({ flexGrow: 1 })}>
                  <Slider
                    min={-180}
                    max={180}
                    step={1}
                    value={rotation()}
                    onInput={(e) => setRotation(e.currentTarget.value)}
                    labelFormatter={(v) => `${v}°`}
                  />
                </div>
              </Row>
            </Match>
          </Switch>
        </Column>

        {/* right: previews & metadata */}
        <Column gap="lg" class={css({ minWidth: "220px", flexGrow: 1 })}>
          <Show when={file()}>
            <Column gap="sm">
              <Text class="label">
                <Trans>Preview</Trans>
              </Text>
              <Row align gap="lg">
                {/* in-context reaction preview */}
                <ReactionPreview>
                  <PreviewViewport style={{ width: "20px", height: "20px" }}>
                    <Show
                      when={!isGif()}
                      fallback={<img src={objectUrl()} data-contain />}
                    >
                      <img src={objectUrl()} style={imageStyle(20)} />
                    </Show>
                  </PreviewViewport>
                  6
                </ReactionPreview>
                {/* large preview */}
                <PreviewViewport style={{ width: "72px", height: "72px" }} data-checker>
                  <Show
                    when={!isGif()}
                    fallback={<img src={objectUrl()} data-contain />}
                  >
                    <img src={objectUrl()} style={imageStyle(72)} />
                  </Show>
                </PreviewViewport>
              </Row>
            </Column>
          </Show>

          <TextField
            required
            value={name()}
            label={t`Emoji Name`}
            placeholder="my_emoji"
            onInput={(e) =>
              setName(e.currentTarget.value.replaceAll(/[^a-zA-Z0-9_]/g, "_"))
            }
          />

          <Column gap="sm">
            <FloatingSelect
              label={t`Upload to`}
              value={serverId()}
              disabled={availableServers().length <= 1}
              onChange={(e) => setServerId(e.currentTarget.value as string)}
            >
              <For each={availableServers()}>
                {(server) => (
                  <MenuItem value={server.id}>{server.name}</MenuItem>
                )}
              </For>
            </FloatingSelect>
            <Show when={slotsRemaining() !== undefined}>
              <Text class="label" size="small">
                <Trans>{slotsRemaining()} emoji slots remaining</Trans>
              </Text>
            </Show>
          </Column>

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

/** Derive an emoji name from a file name */
function suggestName(file?: File) {
  return (
    file?.name
      .replace(/\.[a-zA-Z0-9]+$/, "")
      .replaceAll(/[^a-zA-Z0-9_]/g, "_")
      .slice(0, 32) ?? ""
  );
}

const Layout = styled("div", {
  base: {
    display: "flex",
    gap: "var(--gap-xl)",
    flexWrap: "wrap",
    justifyContent: "center",
  },
});

/** Transparency checkerboard, as used by image editors */
const CHECKERBOARD =
  "repeating-conic-gradient(#ffffff 0% 25%, #cfcfcf 0% 50%) 50% / 16px 16px";

const EditorFrame = styled("div", {
  base: {
    position: "relative",
    width: `${EDITOR_SIZE}px`,
    height: `${EDITOR_SIZE}px`,
    overflow: "hidden",
    borderRadius: "var(--borderRadius-md)",
    background: CHECKERBOARD,
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
      background: "transparent",
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

const ResetHolder = styled("div", {
  base: {
    position: "absolute",
    top: "var(--gap-sm)",
    right: "var(--gap-sm)",
    zIndex: 1,
    borderRadius: "var(--borderRadius-lg)",
    background: "var(--md-sys-color-surface-container-high)",
    opacity: 0.9,
  },
});

/** Small clipped viewport rendering the live crop */
const PreviewViewport = styled("div", {
  base: {
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

    "& img[data-contain]": {
      position: "static",
      width: "100%",
      height: "100%",
      objectFit: "contain",
    },

    "&[data-checker]": {
      background: CHECKERBOARD,
    },
  },
});

/** Mimics the message reaction pill (see Reactions.tsx) */
const ReactionPreview = styled("div", {
  base: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "var(--gap-md)",
    padding: "var(--gap-md)",
    borderRadius: "var(--borderRadius-md)",
    fontWeight: 600,
    fontFeatureSettings: "'tnum' 1",
    color: "var(--md-sys-color-on-secondary-container)",
    background: "var(--md-sys-color-secondary-container)",
    userSelect: "none",
  },
});
