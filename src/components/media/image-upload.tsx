"use client";

import { useRef, useState } from "react";
import { Loader2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { createUploadAction } from "@/actions/upload";
import { acceptFor, checkUpload, type UploadKind } from "@/lib/upload-limits";
import { cn } from "@/lib/utils";

/** Signs, then sends the file straight from the browser to the bucket. Returns the public URL. */
export async function uploadImage(file: File, kind: UploadKind): Promise<string> {
  const invalid = checkUpload(kind, file.type, file.size);
  if (invalid) throw new Error(invalid);

  const ticket = await createUploadAction({ kind, contentType: file.type, size: file.size });
  if (!ticket.ok) throw new Error(ticket.error);

  const { upload } = ticket;
  let res: Response;
  if (upload.method === "POST") {
    const form = new FormData();
    for (const [k, v] of Object.entries(upload.fields)) form.append(k, v);
    form.append("file", file); // must come last
    res = await fetch(upload.url, { method: "POST", body: form });
  } else {
    res = await fetch(upload.url, { method: "PUT", body: file, headers: upload.headers });
  }
  if (!res.ok) throw new Error("Upload failed, please try again");
  return ticket.url;
}

export function ImageUploadButton({
  kind,
  onUploaded,
  label = "Upload",
  className,
}: {
  kind: UploadKind;
  onUploaded: (url: string) => void | Promise<void>;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      await onUploaded(await uploadImage(file, kind));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={acceptFor(kind)}
        hidden
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        aria-label={label || "Upload image"}
        title={label || "Upload image"}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white/85 transition hover:border-brand hover:text-white disabled:opacity-60",
          className,
        )}
      >
        {busy ? <Loader2Icon className="size-4 animate-spin" /> : <UploadIcon className="size-4" />}
        {label && (busy ? "Uploading…" : label)}
      </button>
    </>
  );
}
