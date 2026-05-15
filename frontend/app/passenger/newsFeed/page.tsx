"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { z } from "zod";
import toast from "react-hot-toast";

// ── Zod Schema ────────────────────────────────────────────────────────────────
const newsItemSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string(),
  category: z.string(),
  content: z.string(),
  publishedDate: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

const newsListResponseSchema = z.object({
  total: z.number().optional(),
  page: z.number().optional(),
  totalPages: z.number().optional(),
  news: z.array(newsItemSchema),
});

type NewsItem = z.infer<typeof newsItemSchema>;

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  "Service Update": { bg: "#3b82f6", text: "#fff" },
  "Route Change":   { bg: "#f97316", text: "#fff" },
  "New Route":      { bg: "#22c55e", text: "#fff" },
  "Maintenance":    { bg: "#eab308", text: "#fff" },
  "General":        { bg: "#6b7280", text: "#fff" },
  "Emergency":      { bg: "#ef4444", text: "#fff" },
  "Schedule":       { bg: "#8b5cf6", text: "#fff" },
};

const DEFAULT_CATEGORY_STYLE = { bg: "#6b7280", text: "#fff" };

const CATEGORIES = [
  "All",
  "Service Update",
  "Route Change",
  "New Route",
  "Maintenance",
  "General",
  "Emergency",
  "Schedule",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

/**
 * Converts a stored image path like "/uploads/news/news-xxx.jpg"
 * into a full URL: "http://localhost:4000/uploads/news/news-xxx.jpg"
 */
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
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const getCategoryStyle = (cat: string) =>
  CATEGORY_STYLES[cat] ?? DEFAULT_CATEGORY_STYLE;

// ── Skeleton Card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        border: "1px solid #f0f4f8",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "150px",
          background: "#f3f4f6",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
            animation: "shimmer 1.4s infinite",
          }}
        />
      </div>
      <div style={{ padding: "14px" }}>
        {[70, 90, 55].map((w, i) => (
          <div
            key={i}
            style={{
              height: "10px",
              background: "#f3f4f6",
              borderRadius: "6px",
              marginBottom: "8px",
              width: `${w}%`,
            }}
          />
        ))}
      </div>
      <style>{`@keyframes shimmer { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }`}</style>
    </div>
  );
}

// ── News Card ─────────────────────────────────────────────────────────────────
function NewsCard({ item, onClick }: { item: NewsItem; onClick: () => void }) {
  const catStyle    = getCategoryStyle(item.category);
  const displayDate = formatDate(item.publishedDate ?? item.createdAt);
  const imageUrl    = buildImageUrl(item.image);

  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        border: "1px solid #f0f4f8",
        cursor: "pointer",
        transition: "box-shadow 0.2s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 6px 20px rgba(0,0,0,0.10)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 1px 4px rgba(0,0,0,0.06)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {/* Image */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "150px",
          background: "#e5e7eb",
        }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            style={{ objectFit: "cover" }}
            unoptimized
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #122843 0%, #1b3a5c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px",
              opacity: 0.7,
            }}
          >
            📰
          </div>
        )}
        {/* Badge */}
        <div style={{ position: "absolute", top: "10px", left: "10px" }}>
          <span
            style={{
              background: catStyle.bg,
              color: catStyle.text,
              fontSize: "9px",
              fontWeight: 800,
              padding: "3px 8px",
              borderRadius: "6px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {item.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "14px" }}>
        <h3
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "#111827",
            lineHeight: "1.4",
            marginBottom: "6px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.title}
        </h3>
        <p
          style={{
            fontSize: "11px",
            color: "#6b7280",
            lineHeight: "1.55",
            marginBottom: "10px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.content}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "#122843",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "#fff", fontSize: "7px", fontWeight: 800 }}>
              R
            </span>
          </div>
          <span style={{ fontSize: "10px", color: "#9ca3af" }}>
            {displayDate}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Article Modal ─────────────────────────────────────────────────────────────
function ArticleModal({
  item,
  onClose,
}: {
  item: NewsItem;
  onClose: () => void;
}) {
  const catStyle    = getCategoryStyle(item.category);
  const displayDate = formatDate(item.publishedDate ?? item.createdAt);
  const imageUrl    = buildImageUrl(item.image);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.62)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "24px 24px 0 0",
          width: "100%",
          maxWidth: "540px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
          position: "relative",
        }}
      >
        {/* Image */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "220px",
            flexShrink: 0,
          }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.title}
              fill
              style={{ objectFit: "cover", borderRadius: "24px 24px 0 0" }}
              unoptimized
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #122843, #1b3a5c)",
                borderRadius: "24px 24px 0 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "64px",
                opacity: 0.5,
              }}
            >
              📰
            </div>
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.4), transparent)",
              borderRadius: "24px 24px 0 0",
            }}
          />
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "14px",
              right: "14px",
              width: "32px",
              height: "32px",
              background: "rgba(0,0,0,0.5)",
              border: "none",
              borderRadius: "50%",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
          >
            ✕
          </button>
          {/* Badge */}
          <div style={{ position: "absolute", top: "14px", left: "14px" }}>
            <span
              style={{
                background: catStyle.bg,
                color: catStyle.text,
                fontSize: "10px",
                fontWeight: 800,
                padding: "4px 10px",
                borderRadius: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {item.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 22px 32px" }}>
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 800,
              color: "#111827",
              lineHeight: "1.4",
              marginBottom: "10px",
            }}
          >
            {item.title}
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "#122843",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ color: "#fff", fontSize: "8px", fontWeight: 800 }}>
                R
              </span>
            </div>
            <span style={{ fontSize: "12px", color: "#6b7280" }}>
              {displayDate}
            </span>
            <span style={{ fontSize: "12px", color: "#d1d5db" }}>
              · RouteMe
            </span>
          </div>

          <div
            style={{
              height: "1px",
              background: "#f3f4f6",
              marginBottom: "16px",
            }}
          />

          <p
            style={{
              fontSize: "14px",
              color: "#374151",
              lineHeight: "1.8",
              whiteSpace: "pre-wrap",
            }}
          >
            {item.content}
          </p>

          <button
            onClick={onClose}
            style={{
              width: "100%",
              marginTop: "24px",
              padding: "14px",
              background: "#122843",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "#1b3a5c";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "#122843";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PassengerNewsFeed() {
  const [news, setNews]                       = useState<NewsItem[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [search, setSearch]                   = useState("");
  const [activeCategory, setActiveCategory]   = useState("All");
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [page, setPage]                       = useState(1);
  const [totalPages, setTotalPages]           = useState(1);
  const [total, setTotal]                     = useState(0);
  const LIMIT = 10;

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
      const params: Record<string, string | number | boolean> = {
        page,
        limit: LIMIT,
        publishedOnly: true,
      };
      if (activeCategory !== "All") params.category = activeCategory;

      const response = await axios.get(`${apiBase}/api/v1/news`, { params });

      // Normalize response shape
      const rawData = response.data?.data ?? response.data;
      const parsed  = newsListResponseSchema.safeParse(rawData);

      if (parsed.success) {
        setNews(parsed.data.news);
        setTotalPages(parsed.data.totalPages ?? 1);
        setTotal(parsed.data.total ?? parsed.data.news.length);
      } else {
        // Fallback: try array shape
        const arr = Array.isArray(rawData)
          ? rawData
          : rawData?.news ?? [];
        const validated = arr
          .map((item: unknown) => newsItemSchema.safeParse(item))
          .filter((r: { success: boolean }) => r.success)
          .map((r: { data: NewsItem }) => r.data);
        setNews(validated);
        setTotalPages(1);
        setTotal(validated.length);
      }
    } catch {
      toast.error("Failed to load news");
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Client-side search filter
  const filtered = news.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q)
    );
  });

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setPage(1);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <div style={{ padding: "20px 16px", maxWidth: "760px", margin: "0 auto" }}>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#122843",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            📰
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "#122843",
              margin: 0,
            }}
          >
            News Feed
          </h1>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "14px" }}>
          <span
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "14px",
              color: "#9ca3af",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Search news..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              paddingLeft: "42px",
              paddingRight: "16px",
              height: "44px",
              background: "#fff",
              border: "1.5px solid #e5e7eb",
              borderRadius: "12px",
              fontSize: "14px",
              color: "#111",
              boxSizing: "border-box",
              outline: "none",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          />
        </div>

        {/* Category Filter */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "8px",
            marginBottom: "20px",
            scrollbarWidth: "none",
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              style={{
                flexShrink: 0,
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: 700,
                border:
                  activeCategory === cat ? "none" : "1.5px solid #e5e7eb",
                background: activeCategory === cat ? "#122843" : "#fff",
                color: activeCategory === cat ? "#fff" : "#6b7280",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "14px",
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 20px",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "56px" }}>📭</span>
            <p
              style={{
                fontWeight: 600,
                color: "#6b7280",
                fontSize: "15px",
                margin: 0,
              }}
            >
              No news found
            </p>
            <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>
              {search
                ? "Try a different search"
                : "No articles available in this category"}
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "14px",
              }}
            >
              {filtered.map((item) => (
                <NewsCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedArticle(item)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "28px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1.5px solid #e5e7eb",
                    background: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: page <= 1 ? "#d1d5db" : "#374151",
                    cursor: page <= 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "8px",
                        border: p === page ? "none" : "1.5px solid #e5e7eb",
                        background: p === page ? "#4CAF8A" : "#fff",
                        color: p === page ? "#fff" : "#374151",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1.5px solid #e5e7eb",
                    background: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: page >= totalPages ? "#d1d5db" : "#374151",
                    cursor: page >= totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next
                </button>
              </div>
            )}

            <p
              style={{
                textAlign: "center",
                fontSize: "12px",
                color: "#9ca3af",
                marginTop: "12px",
              }}
            >
              Showing {filtered.length} of {total} articles
            </p>
          </>
        )}
      </div>

      {selectedArticle && (
        <ArticleModal
          item={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}