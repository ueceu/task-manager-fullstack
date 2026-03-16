import { useEffect, useRef } from "react";
import { AssetRecordType, Tldraw, createShapeId, useEditor } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";

function SnapshotBridge({ initialData, onChange }) {
  const editor = useEditor();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!editor || hasLoadedRef.current) return;

    hasLoadedRef.current = true;

    if (initialData) {
      try {
        editor.loadSnapshot(JSON.parse(initialData));
      } catch {
        // If older note content is malformed, open a blank editor instead of crashing.
      }
    }

    const unsubscribe = editor.store.listen(
      () => {
        onChange(JSON.stringify(editor.getSnapshot()));
      },
      { source: "user", scope: "document" }
    );

    return unsubscribe;
  }, [editor, initialData, onChange]);

  return null;
}

export default function NoteCanvas({ data, onChange, externalEditorRef }) {
  const editorRef = useRef(null);

  const handleDrop = (event) => {
    event.preventDefault();

    const stickerUrl = event.dataTransfer.getData("application/tasklink-sticker");
    const editor = editorRef.current;

    if (!stickerUrl || !editor) return;

    const assetId = AssetRecordType.createId(`sticker-${Date.now()}`);
    const mimeType = stickerUrl.startsWith("data:image/svg+xml")
      ? "image/svg+xml"
      : "image/png";
    const pagePoint = editor.screenToPage({
      x: event.clientX,
      y: event.clientY,
    });

    editor.createAssets([
      {
        id: assetId,
        typeName: "asset",
        type: "image",
        props: {
          name: "Sticker",
          src: stickerUrl,
          w: 160,
          h: 160,
          mimeType,
          isAnimated: false,
        },
        meta: {},
      },
    ]);

    editor.createShapes([
      {
        id: createShapeId(),
        type: "image",
        x: pagePoint.x - 80,
        y: pagePoint.y - 80,
        props: {
          assetId,
          w: 160,
          h: 160,
        },
      },
    ]);
  };

  return (
    <div
      className="note-canvas-shell"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <Tldraw
        onMount={(editor) => {
          editorRef.current = editor;
          if (externalEditorRef) {
            externalEditorRef.current = editor;
          }
        }}
      >
        <SnapshotBridge initialData={data} onChange={onChange} />
      </Tldraw>
    </div>
  );
}
