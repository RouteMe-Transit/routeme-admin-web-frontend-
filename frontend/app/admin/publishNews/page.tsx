"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import axios from "axios";
import { z } from "zod";
import { useAdminTheme } from "../AdminThemeContext";

// ── Types ─────────────────────────────────────────────────────────────────────
type NewsCategory =
  | "Service Update"
  | "Route Change"
  | "New Route"
  | "Maintenance"
  | "General"
  | "Emergency";

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORY_OPTIONS: NewsCategory[] = [
  "Service Update",
  "Route Change",
  "New Route",
  "Maintenance",
  "General",
  "Emergency",
];

const CATEGORY_BADGE_STYLES: Record<NewsCategory, { bg: string; text: string }> = {
  "Service Update": { bg: "#dbeafe", text: "#1d4ed8" },
  "Route Change":   { bg: "#ffedd5", text: "#c2410c" },
  "New Route":      { bg: "#dcfce7", text: "#15803d" },
  "Maintenance":    { bg: "#fef9c3", text: "#a16207" },
  "General":        { bg: "#f3f4f6", text: "#374151" },
  "Emergency":      { bg: "#fee2e2", text: "#b91c1c" },
};

const CATEGORY_SOLID: Record<string, { bg: string; text: string }> = {
  "Service Update": { bg: "#3b82f6", text: "#fff" },
  "Route Change":   { bg: "#f97316", text: "#fff" },
  "New Route":      { bg: "#22c55e", text: "#fff" },
  "Maintenance":    { bg: "#eab308", text: "#fff" },
  "General":        { bg: "#6b7280", text: "#fff" },
  "Emergency":      { bg: "#ef4444", text: "#fff" },
};

// ── FIX: Strip trailing /api/v1 from env var to avoid doubled path ────────────
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1")
  .replace(/\/api\/v1$/, "");

// ── Zod Schema ────────────────────────────────────────────────────────────────
const publishNewsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Article title is required")
    .max(255, "Title must be under 255 characters"),
  category: z.enum(
    ["Service Update", "Route Change", "New Route", "Maintenance", "General", "Emergency"] as const,
    { message: "Please select a valid category" },
  ),
  publishedDate: z
    .string()
    .min(1, "Publish date is required")
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  content: z
    .string()
    .trim()
    .min(10, "Content must be at least 10 characters")
    .max(10000, "Content is too long"),
  isPublished: z.boolean(),
});

const publishedNewsItemSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string(),
  category: z.string(),
  content: z.string(),
  publishedDate: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

type PublishNewsForm = z.infer<typeof publishNewsSchema>;
type PublishedNewsItem = z.infer<typeof publishedNewsItemSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────
const getAuthToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

const buildImageUrl = (image?: string | null): string | null => {
  if (!image) return null;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return `${API_BASE}${image.startsWith("/") ? "" : "/"}${image}`;
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminPublishNews() {
  const { isDarkMode } = useAdminTheme();

  // Form state
  const [title,          setTitle]          = useState("");
  const [category,       setCategory]       = useState<NewsCategory>("Service Update");
  const [publishedDate,  setPublishedDate]  = useState("");
  const [content,        setContent]        = useState("");
  const [coverPreview,   setCoverPreview]   = useState<string | null>(null);
  const [coverImageName, setCoverImageName] = useState<string | null>(null);
  const [isDragging,     setIsDragging]     = useState(false);
  const [showPreview,    setShowPreview]    = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [errors,         setErrors]         = useState<Record<string, string>>({});

  // Sidebar state
  const [publishedArticles, setPublishedArticles] = useState<PublishedNewsItem[]>([]);
  const [sidebarLoading,    setSidebarLoading]    = useState(true);
  const [selectedArticle,   setSelectedArticle]   = useState<PublishedNewsItem | null>(null);

  const fileRef   = useRef<HTMLInputElement>(null);
  const coverFile = useRef<File | null>(null);

  // Derived
  const formValues = { title, category, publishedDate, content, isPublished: false };
  const canSubmit  = publishNewsSchema.safeParse(formValues).success;

  // ── Fetch published articles for sidebar ────────────────────────────────────
  const fetchPublished = useCallback(async () => {
    try {
      setSidebarLoading(true);
      const token = getAuthToken();
      const res = await axios.get(`${API_BASE}/api/v1/news`, {
        params: { publishedOnly: true, limit: 20, page: 1 },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const rawData = res.data?.data ?? res.data;
      const arr = Array.isArray(rawData)
        ? rawData
        : rawData?.news ?? [];
      const validated = arr
        .map((item: unknown) => publishedNewsItemSchema.safeParse(item))
        .filter((r: { success: boolean }) => r.success)
        .map((r: { data: PublishedNewsItem }) => r.data);
      setPublishedArticles(validated);
    } catch {
      // silent — sidebar is non-critical
    } finally {
      setSidebarLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublished();
  }, [fetchPublished]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (): PublishNewsForm | null => {
    const result = publishNewsSchema.safeParse(formValues);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? "form");
        if (!errs[key]) errs[key] = issue.message;
      });
      setErrors(errs);
      toast.error(result.error.issues[0]?.message ?? "Please fix form errors");
      return null;
    }
    setErrors({});
    return result.data;
  };

  // ── Image handling ──────────────────────────────────────────────────────────
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a PNG or JPG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    coverFile.current = file;
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
    setPublishedDate("");
    setContent("");
    setCoverPreview(null);
    setCoverImageName(null);
    coverFile.current = null;
    setErrors({});
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const submitNews = async (isPublished: boolean) => {
    const token      = getAuthToken();
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    if (coverFile.current) {
      const fd = new FormData();
      fd.append("title",         title.trim());
      fd.append("category",      category);
      fd.append("content",       content.trim());
      fd.append("isPublished",   String(isPublished));
      fd.append("publishedDate", new Date(publishedDate).toISOString());
      fd.append("image",         coverFile.current);
      return axios.post(`${API_BASE}/api/v1/news`, fd, {
        headers: { ...authHeader, "Content-Type": "multipart/form-data" },
      });
    }

    return axios.post(
      `${API_BASE}/api/v1/news`,
      {
        title:         title.trim(),
        category,
        content:       content.trim(),
        isPublished,
        publishedDate: new Date(publishedDate).toISOString(),
      },
      { headers: authHeader },
    );
  };

  const handlePublish = async () => {
    const data = validate();
    if (!data) return;
    try {
      setSubmitting(true);
      await submitNews(true);
      toast.success("Article published successfully!");
      resetForm();
      fetchPublished();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg =
          err.response?.data?.message ??
          err.response?.data?.errors?.[0]?.msg ??
          "Failed to publish article";
        toast.error(msg);
      } else {
        toast.error("Failed to publish article");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDraft = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title before saving as draft.");
      return;
    }
    try {
      setSubmitting(true);
      await submitNews(false);
      toast.success("Draft saved.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message ?? "Failed to save draft");
      } else {
        toast.error("Failed to save draft");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const bg        = isDarkMode ? "#14263A" : "#fff";
  const outerBg   = isDarkMode ? "#1A2F47" : "#F8FAFC";
  const sidebarBg = isDarkMode ? "#14263A" : "#fff";
  const labelClr  = isDarkMode ? "#e2eaf4" : "#1b3a5c";
  const inputBg   = isDarkMode ? "#1A2F47" : "#fff";
  const inputClr  = isDarkMode ? "#fff" : "#111";
  const inputBdr  = (field: string) =>
    errors[field] ? "#ef4444" : isDarkMode ? "#3a5a7a" : "#d1d5db";

  const inputStyle = (field: string): React.CSSProperties => ({
    display: "block",
    width: "100%",
    height: "48px",
    border: `1.5px solid ${inputBdr(field)}`,
    borderRadius: "8px",
    padding: "0 16px",
    fontSize: "14px",
    color: inputClr,
    background: inputBg,
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s",
  });

  const badge = CATEGORY_BADGE_STYLES[category];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: outerBg, minHeight: "100%", width: "100%", padding: "24px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", maxWidth: "1280px", width: "100%" }}>

        {/* ── Left: Publish Form ─────────────────────────────────────────── */}
        <div
          style={{
            background: bg,
            borderRadius: "14px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            padding: "36px",
            flex: "1 1 0",
            minWidth: 0,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
            <div
              style={{
                width: "40px", height: "40px", borderRadius: "10px",
                background: "linear-gradient(135deg, #122843, #1b3a5c)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px",
              }}
            >
              📰
            </div>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: isDarkMode ? "#fff" : "#1b3a5c", margin: 0 }}>
                Create New Article
              </h2>
              <p style={{ fontSize: "13px", color: isDarkMode ? "#8ba7c4" : "#6b7280", margin: "2px 0 0" }}>
                Fields marked <span style={{ color: "#ef4444" }}>*</span> are required
              </p>
            </div>
          </div>

          {/* Title */}
          <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, color: labelClr, fontSize: "13px" }}>
            Article Title <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="text"
            style={{ ...inputStyle("title"), marginBottom: errors.title ? "4px" : "24px" }}
            placeholder="Enter a concise title for the article"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {errors.title && <p style={{ fontSize: "12px", color: "#ef4444", marginBottom: "20px" }}>{errors.title}</p>}

          {/* Category + Date */}
          <div style={{ display: "flex", gap: "20px", marginBottom: "24px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, color: labelClr, fontSize: "13px" }}>
                Category <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select
                style={{ ...inputStyle("category"), cursor: "pointer", appearance: "auto" }}
                value={category}
                onChange={(e) => setCategory(e.target.value as NewsCategory)}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, color: labelClr, fontSize: "13px" }}>
                Publish Date <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="date"
                style={{ ...inputStyle("publishedDate") }}
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
              />
              {errors.publishedDate && (
                <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>{errors.publishedDate}</p>
              )}
            </div>
          </div>

          {/* Content */}
          <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, color: labelClr, fontSize: "13px" }}>
            Content <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <textarea
            style={{
              display: "block", width: "100%", minHeight: "160px",
              border: `1.5px solid ${inputBdr("content")}`,
              borderRadius: "8px", padding: "14px 16px", fontSize: "14px",
              color: inputClr, background: inputBg, resize: "vertical",
              marginBottom: errors.content ? "4px" : "24px",
              boxSizing: "border-box", lineHeight: "1.7", outline: "none", fontFamily: "inherit",
            }}
            placeholder="Enter detailed content for the article..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {errors.content && <p style={{ fontSize: "12px", color: "#ef4444", marginBottom: "20px" }}>{errors.content}</p>}

          {/* Cover Image */}
          <label style={{ display: "block", marginBottom: "8px", fontWeight: 700, color: labelClr, fontSize: "13px" }}>
            Cover Image <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span>
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            style={{
              position: "relative", width: "100%", height: "180px",
              border: `2px dashed ${isDragging ? "#4CAF8A" : isDarkMode ? "#3a5a7a" : "#d1d5db"}`,
              borderRadius: "12px",
              background: isDragging
                ? (isDarkMode ? "#1e3d2a" : "#f0faf6")
                : (isDarkMode ? "#1A2F47" : "#f8fafc"),
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              cursor: "pointer", overflow: "hidden", marginBottom: "32px",
              transition: "border-color 0.2s, background 0.2s", boxSizing: "border-box",
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              style={{ display: "none" }}
              onChange={(e) => { if (e.target.files?.[0]) handleImageFile(e.target.files[0]); }}
            />
            {coverPreview ? (
              <>
                <img
                  src={coverPreview}
                  alt="Cover"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: "6px",
                  }}
                >
                  <span style={{ fontSize: "28px" }}>🖼️</span>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: "13px", maxWidth: "300px", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {coverImageName}
                  </p>
                  <p style={{ color: "#d1fae5", fontSize: "11px" }}>Click to change</p>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", pointerEvents: "none" }}>
                <div style={{ fontSize: "40px", opacity: 0.4 }}>🖼️</div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: isDarkMode ? "#8ba7c4" : "#4b5563" }}>
                  Drag &amp; drop or <span style={{ color: "#4CAF8A" }}>browse</span> to upload
                </p>
                <p style={{ fontSize: "12px", color: isDarkMode ? "#5a7a9a" : "#9ca3af" }}>PNG, JPG up to 5 MB</p>
              </div>
            )}
          </div>

          {/* Separator */}
          <div style={{ height: "1px", background: isDarkMode ? "#243a52" : "#f0f4f8", marginBottom: "24px" }} />

          {/* Actions */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              disabled={!canSubmit || submitting}
              onClick={handlePublish}
              style={{
                height: "46px", padding: "0 28px",
                background: canSubmit && !submitting ? "#4CAF8A" : "#a7d9c5",
                color: "#fff", fontWeight: 700, borderRadius: "8px",
                cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
                border: "none", fontSize: "14px", transition: "background 0.2s",
              }}
            >
              {submitting ? "Publishing…" : "Publish Now"}
            </button>

            <button
              onClick={handleDraft}
              disabled={submitting}
              style={{
                height: "46px", padding: "0 28px",
                background: isDarkMode ? "#1A2F47" : "#fff",
                border: `1.5px solid ${isDarkMode ? "#3a5a7a" : "#d1d5db"}`,
                color: isDarkMode ? "#e2eaf4" : "#1b3a5c",
                fontWeight: 700, borderRadius: "8px",
                cursor: submitting ? "not-allowed" : "pointer", fontSize: "14px",
              }}
            >
              Save Draft
            </button>

            <button
              disabled={!canSubmit}
              onClick={() => setShowPreview(true)}
              style={{
                height: "46px", padding: "0 28px",
                background: isDarkMode ? "#1A2F47" : "#fff",
                border: `1.5px solid ${isDarkMode ? "#3a5a7a" : "#d1d5db"}`,
                color: canSubmit ? (isDarkMode ? "#e2eaf4" : "#1b3a5c") : "#9ca3af",
                fontWeight: 700, borderRadius: "8px",
                cursor: canSubmit ? "pointer" : "not-allowed", fontSize: "14px",
              }}
            >
              Preview
            </button>

            <button
              onClick={resetForm}
              style={{
                height: "46px", padding: "0 28px",
                background: isDarkMode ? "#1A2F47" : "#fff",
                border: `1.5px solid ${isDarkMode ? "#3a5a7a" : "#d1d5db"}`,
                color: isDarkMode ? "#8ba7c4" : "#6b7280",
                fontWeight: 700, borderRadius: "8px",
                cursor: "pointer", fontSize: "14px", marginLeft: "auto",
              }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* ── Right: Published Articles Sidebar ─────────────────────────── */}
        <div
          style={{
            width: "320px",
            flexShrink: 0,
            background: sidebarBg,
            borderRadius: "14px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            overflow: "hidden",
            position: "sticky",
            top: "24px",
            maxHeight: "calc(100vh - 48px)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Sidebar Header */}
          <div
            style={{
              padding: "20px 20px 16px",
              borderBottom: `1px solid ${isDarkMode ? "#243a52" : "#f0f4f8"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "28px", height: "28px", borderRadius: "8px",
                  background: "linear-gradient(135deg, #122843, #1b3a5c)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
                }}
              >
                📋
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 800, color: isDarkMode ? "#fff" : "#1b3a5c", margin: 0 }}>
                  Published Articles
                </p>
                <p style={{ fontSize: "11px", color: isDarkMode ? "#8ba7c4" : "#9ca3af", margin: 0 }}>
                  {publishedArticles.length} article{publishedArticles.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={fetchPublished}
              title="Refresh"
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "14px", color: isDarkMode ? "#8ba7c4" : "#9ca3af",
                padding: "4px", borderRadius: "6px",
                transition: "color 0.2s",
              }}
            >
              🔄
            </button>
          </div>

          {/* Sidebar List */}
          <div style={{ overflowY: "auto", flex: 1, padding: "12px" }}>
            {sidebarLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", gap: "10px", alignItems: "center",
                    padding: "10px", marginBottom: "8px",
                    borderRadius: "10px",
                    background: isDarkMode ? "#1A2F47" : "#f8fafc",
                  }}
                >
                  <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: isDarkMode ? "#243a52" : "#e5e7eb", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: "10px", background: isDarkMode ? "#243a52" : "#e5e7eb", borderRadius: "4px", marginBottom: "6px", width: "80%" }} />
                    <div style={{ height: "8px", background: isDarkMode ? "#243a52" : "#e5e7eb", borderRadius: "4px", width: "50%" }} />
                  </div>
                </div>
              ))
            ) : publishedArticles.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <span style={{ fontSize: "36px" }}>📭</span>
                <p style={{ fontSize: "13px", color: isDarkMode ? "#8ba7c4" : "#6b7280", marginTop: "8px" }}>
                  No published articles yet
                </p>
              </div>
            ) : (
              publishedArticles.map((article) => {
                const imgUrl   = buildImageUrl(article.image);
                const catStyle = CATEGORY_SOLID[article.category] ?? { bg: "#6b7280", text: "#fff" };
                const isSelected = selectedArticle?.id === article.id;

                return (
                  <div
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    style={{
                      display: "flex", gap: "10px",
                      padding: "10px", marginBottom: "8px",
                      borderRadius: "10px", cursor: "pointer",
                      border: `1.5px solid ${isSelected
                        ? "#4CAF8A"
                        : isDarkMode ? "#243a52" : "#f0f4f8"}`,
                      background: isSelected
                        ? (isDarkMode ? "#1e3d2a" : "#f0faf6")
                        : (isDarkMode ? "#1A2F47" : "#f8fafc"),
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLDivElement).style.background =
                          isDarkMode ? "#1e3050" : "#f0f4f8";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLDivElement).style.background =
                          isDarkMode ? "#1A2F47" : "#f8fafc";
                      }
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      style={{
                        width: "52px", height: "52px", borderRadius: "8px",
                        overflow: "hidden", flexShrink: 0, position: "relative",
                        background: isDarkMode ? "#243a52" : "#e5e7eb",
                      }}
                    >
                      {imgUrl ? (
                        <Image
                          src={imgUrl}
                          alt={article.title}
                          fill
                          style={{ objectFit: "cover" }}
                          unoptimized
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%", height: "100%",
                            background: "linear-gradient(135deg, #122843, #1b3a5c)",
                            display: "flex", alignItems: "center",
                            justifyContent: "center", fontSize: "20px", opacity: 0.8,
                          }}
                        >
                          📰
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "12px", fontWeight: 700,
                          color: isDarkMode ? "#e2eaf4" : "#111827",
                          margin: "0 0 4px",
                          overflow: "hidden", textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {article.title}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            background: catStyle.bg, color: catStyle.text,
                            fontSize: "8px", fontWeight: 800,
                            padding: "2px 6px", borderRadius: "4px",
                            textTransform: "uppercase", letterSpacing: "0.04em",
                          }}
                        >
                          {article.category}
                        </span>
                        <span style={{ fontSize: "10px", color: isDarkMode ? "#8ba7c4" : "#9ca3af" }}>
                          {formatDate(article.publishedDate ?? article.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── New Article Preview Modal (form preview) ───────────────────────── */}
      {showPreview && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.6)", overflowY: "auto",
            display: "flex", alignItems: "flex-start",
            justifyContent: "center", padding: "32px 16px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPreview(false); }}
        >
          <div
            style={{
              position: "relative", background: "#fff", borderRadius: "20px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
              width: "100%", maxWidth: "700px",
            }}
          >
            {coverPreview ? (
              <div style={{ width: "100%", height: "280px", borderRadius: "20px 20px 0 0", overflow: "hidden" }}>
                <img src={coverPreview} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            ) : (
              <div
                style={{
                  width: "100%", height: "140px",
                  background: "linear-gradient(135deg, #122843, #1b3a5c)",
                  borderRadius: "20px 20px 0 0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "48px", opacity: 0.3 }}>📰</span>
              </div>
            )}

            <button
              onClick={() => setShowPreview(false)}
              style={{
                position: "absolute", top: "14px", right: "16px",
                background: "rgba(255,255,255,0.9)", border: "none",
                borderRadius: "50%", width: "34px", height: "34px",
                fontSize: "16px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, color: "#374151", zIndex: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              ✕
            </button>

            <div style={{ padding: "28px 36px 40px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "14px" }}>
                <span
                  style={{
                    background: badge.bg, color: badge.text,
                    fontSize: "11px", fontWeight: 700,
                    padding: "3px 12px", borderRadius: "999px",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}
                >
                  {category}
                </span>
                {publishedDate && (
                  <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                    {new Date(publishedDate).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "long", year: "numeric",
                    })}
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#1b3a5c", marginBottom: "16px", lineHeight: "1.3" }}>
                {title || "(No title entered)"}
              </h1>
              <div style={{ height: "3px", width: "52px", background: "#4CAF8A", borderRadius: "2px", marginBottom: "18px" }} />
              <p style={{ fontSize: "15px", color: "#374151", lineHeight: "1.85", whiteSpace: "pre-wrap" }}>
                {content || "(No content entered)"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Selected Published Article Modal ───────────────────────────────── */}
      {selectedArticle && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "32px 16px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedArticle(null); }}
        >
          <style>{`
            @keyframes articleModalIn {
              from { opacity: 0; transform: scale(0.94) translateY(16px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>

          <div
            style={{
              position: "relative",
              background: isDarkMode ? "#14263A" : "#fff",
              borderRadius: "20px",
              boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
              width: "100%",
              maxWidth: "660px",
              maxHeight: "88vh",
              overflowY: "auto",
              animation: "articleModalIn 0.22s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            {/* Cover image or gradient header */}
            {buildImageUrl(selectedArticle.image) ? (
              <div style={{ width: "100%", height: "240px", borderRadius: "20px 20px 0 0", overflow: "hidden", flexShrink: 0 }}>
                <Image
                  src={buildImageUrl(selectedArticle.image)!}
                  alt={selectedArticle.title}
                  width={660}
                  height={240}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  unoptimized
                />
              </div>
            ) : (
              <div
                style={{
                  width: "100%", height: "130px", flexShrink: 0,
                  background: "linear-gradient(135deg, #122843 0%, #1b3a5c 60%, #4CAF8A22 100%)",
                  borderRadius: "20px 20px 0 0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "52px", opacity: 0.25 }}>📰</span>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => setSelectedArticle(null)}
              style={{
                position: "absolute", top: "14px", right: "16px",
                background: "rgba(255,255,255,0.92)",
                border: "none", borderRadius: "50%",
                width: "36px", height: "36px",
                fontSize: "16px", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, color: "#374151", zIndex: 10,
                boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
                transition: "background 0.15s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#fff";
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.92)";
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              }}
            >
              ✕
            </button>

            {/* Content */}
            <div style={{ padding: "28px 36px 40px" }}>
              {/* Category badge + date */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "14px" }}>
                {(() => {
                  const catStyle = CATEGORY_SOLID[selectedArticle.category] ?? { bg: "#6b7280", text: "#fff" };
                  return (
                    <span
                      style={{
                        background: catStyle.bg, color: catStyle.text,
                        fontSize: "11px", fontWeight: 700,
                        padding: "4px 14px", borderRadius: "999px",
                        textTransform: "uppercase", letterSpacing: "0.07em",
                      }}
                    >
                      {selectedArticle.category}
                    </span>
                  );
                })()}
                <span style={{ fontSize: "12px", color: isDarkMode ? "#8ba7c4" : "#9ca3af" }}>
                  {formatDate(selectedArticle.publishedDate ?? selectedArticle.createdAt)}
                </span>
              </div>

              {/* Title */}
              <h2
                style={{
                  fontSize: "22px", fontWeight: 800,
                  color: isDarkMode ? "#f0f6ff" : "#1b3a5c",
                  margin: "0 0 14px", lineHeight: "1.35",
                }}
              >
                {selectedArticle.title}
              </h2>

              {/* Accent bar */}
              <div style={{ height: "3px", width: "48px", background: "#4CAF8A", borderRadius: "2px", marginBottom: "20px" }} />

              {/* Body */}
              <p
                style={{
                  fontSize: "14px", lineHeight: "1.9",
                  color: isDarkMode ? "#c2d4e8" : "#374151",
                  whiteSpace: "pre-wrap", margin: 0,
                }}
              >
                {selectedArticle.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}