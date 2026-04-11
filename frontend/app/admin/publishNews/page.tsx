"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";

type NewsCategory =
  | "Service Update"
  | "Route Change"
  | "New Route"
  | "Maintenance"
  | "General"
  | "Emergency";

const CATEGORY_OPTIONS: NewsCategory[] = [
  "Service Update",
  "Route Change",
  "New Route",
  "Maintenance",
  "General",
  "Emergency",
];

export default function AdminPublishNews() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<NewsCategory>("Service Update");
  const [publishDate, setPublishDate] = useState("");
  const [content, setContent] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverImageName, setCoverImageName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canSubmit = title.trim() && category && publishDate && content.trim();

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a PNG or JPG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    setCoverImageName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setCoverPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const resetForm = () => {
    setTitle("");
    setCategory("Service Update");
    setPublishDate("");
    setContent("");
    setCoverPreview(null);
    setCoverImageName(null);
  };

  const handlePublish = () => {
    if (!canSubmit) return;
    toast.success("Article published successfully!");
    resetForm();
  };

  const handleDraft = () => {
    if (!title.trim()) {
      toast.error("Please enter a title before saving as draft.");
      return;
    }
    toast.success("Draft saved.");
  };

  return (
    <>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          padding: "32px",
          maxWidth: "860px",
          width: "100%",
        }}
      >
        <h2
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "#1b3a5c",
            marginBottom: "28px",
          }}
        >
          Create New Article
        </h2>

        {/* ── Article Title ── */}
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: 700,
            color: "#1b3a5c",
            fontSize: "14px",
          }}
        >
          Article Title
        </label>
        <input
          type="text"
          style={{
            display: "block",
            width: "100%",
            height: "48px",
            border: "1.5px solid #d1d5db",
            borderRadius: "8px",
            padding: "0 16px",
            fontSize: "14px",
            color: "#111",
            background: "#fff",
            marginBottom: "24px",
            boxSizing: "border-box",
          }}
          placeholder="Enter a concise title for the article"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* ── Category + Publish Date ── */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: "180px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 700,
                color: "#1b3a5c",
                fontSize: "14px",
              }}
            >
              Category
            </label>
            <select
              style={{
                display: "block",
                width: "100%",
                height: "48px",
                border: "1.5px solid #d1d5db",
                borderRadius: "8px",
                padding: "0 12px",
                fontSize: "14px",
                color: "#111",
                background: "#fff",
                boxSizing: "border-box",
              }}
              value={category}
              onChange={(e) => setCategory(e.target.value as NewsCategory)}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: "180px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 700,
                color: "#1b3a5c",
                fontSize: "14px",
              }}
            >
              Publish Date
            </label>
            <input
              type="date"
              style={{
                display: "block",
                width: "100%",
                height: "48px",
                border: "1.5px solid #d1d5db",
                borderRadius: "8px",
                padding: "0 12px",
                fontSize: "14px",
                color: "#111",
                background: "#fff",
                boxSizing: "border-box",
              }}
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
            />
          </div>
        </div>

        {/* ── Content ── */}
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: 700,
            color: "#1b3a5c",
            fontSize: "14px",
          }}
        >
          Content
        </label>
        <textarea
          style={{
            display: "block",
            width: "100%",
            height: "160px",
            border: "1.5px solid #d1d5db",
            borderRadius: "8px",
            padding: "12px 16px",
            fontSize: "14px",
            color: "#111",
            background: "#fff",
            resize: "vertical",
            marginBottom: "24px",
            boxSizing: "border-box",
            lineHeight: "1.6",
          }}
          placeholder="Enter detailed content for the article..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* ── Cover Image ── */}
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: 700,
            color: "#1b3a5c",
            fontSize: "14px",
          }}
        >
          Cover Image
        </label>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            position: "relative",
            width: "100%",
            height: "200px",
            border: `2px dashed ${isDragging ? "#4CAF8A" : "#9ca3af"}`,
            borderRadius: "12px",
            background: isDragging ? "#f0faf6" : "#f8fafc",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            overflow: "hidden",
            marginBottom: "28px",
            transition: "border-color 0.2s, background 0.2s",
            boxSizing: "border-box",
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
            }}
          />

          {coverPreview ? (
            <>
              <img
                src={coverPreview}
                alt="Cover"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.40)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <span style={{ fontSize: "28px" }}>🖼️</span>
                <p
                  style={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "13px",
                    maxWidth: "300px",
                    textAlign: "center",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {coverImageName}
                </p>
                <p style={{ color: "#d1fae5", fontSize: "11px" }}>
                  Click to change
                </p>
              </div>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
                pointerEvents: "none",
              }}
            >
              <img
                src="/icons/newsimage.png"
                alt="Add cover image"
                style={{ width: "64px", height: "64px", objectFit: "contain" }}
              />
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#4b5563" }}>
                Drag &amp; drop or{" "}
                <span style={{ color: "#4CAF8A" }}>browse</span> to upload
              </p>
              <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                PNG, JPG up to 5 MB
              </p>
            </div>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            disabled={!canSubmit}
            onClick={handlePublish}
            style={{
              height: "48px",
              padding: "0 28px",
              background: canSubmit ? "#4CAF8A" : "#a7d9c5",
              color: "#fff",
              fontWeight: 800,
              borderRadius: "8px",
              cursor: canSubmit ? "pointer" : "not-allowed",
              border: "none",
              fontSize: "15px",
            }}
          >
            Publish Now
          </button>
          <button
            onClick={handleDraft}
            style={{
              height: "48px",
              padding: "0 28px",
              background: "#fff",
              border: "1.5px solid #d1d5db",
              color: "#1b3a5c",
              fontWeight: 800,
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "15px",
            }}
          >
            Save Draft
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => setShowPreview(true)}
            style={{
              height: "48px",
              padding: "0 28px",
              background: "#fff",
              border: "1.5px solid #d1d5db",
              color: canSubmit ? "#1b3a5c" : "#9ca3af",
              fontWeight: 800,
              borderRadius: "8px",
              cursor: canSubmit ? "pointer" : "not-allowed",
              fontSize: "15px",
            }}
          >
            Preview
          </button>
          <button
            onClick={resetForm}
            style={{
              height: "48px",
              padding: "0 28px",
              background: "#fff",
              border: "1.5px solid #d1d5db",
              color: "#6b7280",
              fontWeight: 800,
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "15px",
              marginLeft: "auto",
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* ── Preview Modal ── */}
      {showPreview && (
        // Backdrop — scrollable so modal never clips on short screens
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.55)",
            overflowY: "auto",          // KEY FIX: backdrop scrolls, not the modal
            display: "flex",
            alignItems: "flex-start",   // align to top so content is reachable on scroll
            justifyContent: "center",
            padding: "32px 16px",       // breathing room top & bottom
          }}
          // Close on backdrop click
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPreview(false);
          }}
        >
          <div
            style={{
              position: "relative",
              background: "#fff",
              borderRadius: "20px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.22)",
              width: "100%",
              maxWidth: "680px",
              // No maxHeight or overflowY here — let the content grow naturally
              // so the image is never clipped
            }}
          >
            {/* ── Cover image: fixed height, never overflows ── */}
            {coverPreview ? (
              <div
                style={{
                  width: "100%",
                  height: "280px",            // generous fixed height
                  borderRadius: "20px 20px 0 0",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <img
                  src={coverPreview}
                  alt="Cover"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",       // KEY FIX: show full image, no cropping
                    objectPosition: "center",
                    display: "block",
                    background: "#f1f5f9",      // neutral bg for letterboxing
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "140px",
                  background: "linear-gradient(135deg,#122843,#1b3a5c)",
                  borderRadius: "20px 20px 0 0",
                }}
              />
            )}

            {/* ── Close button ── */}
            <button
              onClick={() => setShowPreview(false)}
              style={{
                position: "absolute",
                top: "14px",
                right: "16px",
                background: "rgba(255,255,255,0.88)",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                fontSize: "15px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: "#374151",
                zIndex: 10,
              }}
              aria-label="Close preview"
            >
              ✕
            </button>

            {/* ── Article body ── */}
            <div style={{ padding: "28px 32px 36px" }}>
              {/* Badge + date */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  flexWrap: "wrap",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    background: "#d1fae5",
                    color: "#065f46",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "999px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {category}
                </span>
                {publishDate && (
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                    {new Date(publishDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "#1b3a5c",
                  marginBottom: "14px",
                  lineHeight: "1.35",
                }}
              >
                {title || "(No title entered)"}
              </h1>

              {/* Teal accent line */}
              <div
                style={{
                  height: "3px",
                  width: "48px",
                  background: "#4CAF8A",
                  borderRadius: "2px",
                  marginBottom: "16px",
                }}
              />

              {/* Content */}
              <p
                style={{
                  fontSize: "14px",
                  color: "#374151",
                  lineHeight: "1.85",
                  whiteSpace: "pre-wrap",
                }}
              >
                {content || "(No content entered)"}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
