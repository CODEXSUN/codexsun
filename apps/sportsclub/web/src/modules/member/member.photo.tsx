"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { getMemberPhoto } from "./member.services";

const photoTypes = ["image/jpeg", "image/png", "image/webp"];
export const maxMemberPhotoBytes = 2 * 1024 * 1024;

export function validateMemberPhoto(file: File): string | null {
  if (!photoTypes.includes(file.type)) return "Choose a JPEG, PNG, or WebP image.";
  if (file.size > maxMemberPhotoBytes) return "Photo must be 2 MB or smaller.";
  if (file.size === 0) return "Choose a nonempty image.";
  return null;
}

export function MemberPhotoField({
  memberUuid,
  file,
  onFileChange,
  disabled,
  error,
  onError
}: {
  memberUuid?: string | undefined;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled: boolean;
  error: string | null;
  onError: (error: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const { data: savedPhoto, isError: photoLoadError } = useQuery({
    queryKey: ["sportsclub", "member", memberUuid, "photo"],
    queryFn: () => getMemberPhoto(memberUuid!),
    enabled: Boolean(memberUuid),
    retry: false
  });

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const accept = (candidate?: File) => {
    if (!candidate) return;
    const nextError = validateMemberPhoto(candidate);
    onError(nextError);
    onFileChange(nextError ? null : candidate);
  };
  const image =
    preview ??
    (savedPhoto ? `data:${savedPhoto.mimeType};base64,${savedPhoto.contentBase64}` : null);

  return (
    <div className="rounded-xl border border-border/80 bg-muted/20 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background text-muted-foreground">
          {image ? (
            <img src={image} alt="Student profile" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-8" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Student photo</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            JPEG, PNG or WebP, up to 2 MB. Saved with this member record.
          </p>
          <div
            className={`mt-3 rounded-lg border border-dashed p-3 transition-colors ${dragging ? "border-primary bg-primary/10" : "border-border bg-background"}`}
            onDragOver={(event) => {
              event.preventDefault();
              if (!disabled) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              if (!disabled) accept(event.dataTransfer.files[0]);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              aria-label="Choose student photo"
              disabled={disabled}
              onChange={(event) => accept(event.target.files?.[0])}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="mr-2 size-4" aria-hidden="true" /> Choose photo
              </Button>
              <span className="text-xs text-muted-foreground">or drag an image here</span>
              {file ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => {
                    onFileChange(null);
                    onError(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                >
                  <X className="mr-1 size-3" aria-hidden="true" />
                  Remove selection
                </Button>
              ) : null}
            </div>
          </div>
          {file ? (
            <p className="mt-2 text-xs text-foreground" role="status">
              {file.name} selected. It will upload when you save.
            </p>
          ) : savedPhoto ? (
            <p className="mt-2 text-xs text-muted-foreground">Saved photo attached.</p>
          ) : null}
          {error ? (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {photoLoadError ? (
            <p className="mt-2 text-xs text-destructive" role="alert">
              Could not load the saved photo.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
