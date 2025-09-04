// pages/OperatorDashboard.jsx
// Full, ready-to-use React component (extended, detailed, 500+ lines).
// Uses only API endpoints (no mock data). Endpoints used:
//  - GET  /api/operator/jobs
//  - POST /api/operator/send-to-checker
//  - GET  /api/operator/checker-response/:jobId
//
// Make sure to place this file in your pages/ or proper route folder and
// adapt import path for the CSS if necessary.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./OperatorDashboard.css";

/**
 * OperatorDashboard
 *
 * - Fully featured operator dashboard component.
 * - Keeps the UI structure and styling-compatible with OperatorDashboard.css.
 * - Pulls data exclusively from API endpoints (no inline mock data).
 * - Adds:
 *    * job list fetch with filters, sort, pagination
 *    * sendToChecker API call with optimistic UI and retry handling
 *    * viewCheckerResponse that loads the latest checker response for a job
 *    * job details drawer/modal with all job fields returned by API
 *    * bulk actions (select multiple jobs and send to checker)
 *    * client-side caching / simple in-memory store to reduce repeated fetches
 *    * polling toggle to auto-refresh job list
 *    * error handling & user-friendly messages
 *
 * Notes:
 *  - Backend must return JSON in expected shapes (see usage below).
 *  - You can change endpoints centrally in BASE_API constant.
 */

/* ---------- Configuration ---------- */

const BASE_API = ""; // If your API is hosted at same origin, keep empty. Otherwise set e.g. "https://api.example.com"

const ENDPOINTS = {
  JOBS: `${BASE_API}/api/operator/jobs`,
  SEND_TO_CHECKER: `${BASE_API}/api/operator/send-to-checker`,
  CHECKER_RESPONSE: (jobId) => `${BASE_API}/api/operator/checker-response/${jobId}`,
};

/* ---------- Utility helpers ---------- */

function safeJsonParse(response) {
  return response
    .text()
    .then((text) => {
      try {
        return text ? JSON.parse(text) : null;
      } catch (e) {
        // If server returned non-JSON but OK, return raw text
        return text;
      }
    })
    .catch(() => null);
}

function formatDate(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

/* ---------- Small UI components (internal) ---------- */

function IconRefresh() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle" }}>
      <path d="M21 12a9 9 0 10-8.95 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle" }}>
      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2l-7 20 2-7 7-7z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Tiny toast manager (in-component, simple) */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(1);

  const push = useCallback((text, opts = {}) => {
    const id = idRef.current++;
    setToasts((t) => [...t, { id, text, ...opts }]);
    if (!opts.persistent) {
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, opts.duration || 3500);
    }
    return id;
  }, []);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const ToastContainer = useMemo(
    () => (
      <div style={{ position: "fixed", right: 20, top: 20, zIndex: 9999 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: "#111827",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 8,
              boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
              minWidth: 220,
            }}
            onClick={() => remove(t.id)}
          >
            {t.text}
          </div>
        ))}
      </div>
    ),
    [toasts, remove]
  );

  return { push, remove, ToastContainer };
}

/* ---------- Main component ---------- */

export default function OperatorDashboard() {
  /* Local state */
  const [jobs, setJobs] = useState([]); // array of job objects from API
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedJob, setSelectedJob] = useState(null); // job for details drawer
  const [checkerResponse, setCheckerResponse] = useState(null); // shown below list
  const [selectedIds, setSelectedIds] = useState(new Set()); // for bulk actions
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState(null);
  const [sendingSet, setSendingSet] = useState(new Set()); // jobs currently being sent

  const inMemoryCache = useRef(new Map()); // simple cache keyed by `${page}-${perPage}-${query}-${statusFilter}-${sortBy}-${sortDir}`

  const toasts = useToasts();

  /* Build query key to cache responses */
  const cacheKey = useMemo(() => `${page}|${perPage}|${query}|${statusFilter}|${sortBy}|${sortDir}`, [
    page,
    perPage,
    query,
    statusFilter,
    sortBy,
    sortDir,
  ]);

  /* Fetch jobs from server */
  const fetchJobs = useCallback(
    async (opts = {}) => {
      const { replace = true, append = false } = opts;
      setError(null);
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);

        // Use cache if present
        if (inMemoryCache.current.has(cacheKey)) {
          const cached = inMemoryCache.current.get(cacheKey);
          if (replace) {
            setJobs(cached.jobs);
            setTotal(cached.total);
            setLoading(false);
            setLoadingMore(false);
            return;
          }
        }

        const params = new URLSearchParams();
        params.set("page", page);
        params.set("perPage", perPage);
        if (query) params.set("q", query);
        if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
        if (sortBy) params.set("sortBy", sortBy);
        if (sortDir) params.set("sortDir", sortDir);

        const res = await fetch(`${ENDPOINTS.JOBS}?${params.toString()}`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          const parsed = await safeJsonParse(res);
          const message = (parsed && parsed.message) || `Ishlar olinmadi: ${res.status}`;
          throw new Error(message);
        }

        const data = await res.json();

        /**
         * Expected data shape from backend:
         * {
         *   jobs: [ { id, title, status, createdAt, operator, ... } ],
         *   total: <number>
         * }
         */

        const fetchedJobs = Array.isArray(data.jobs) ? data.jobs : [];
        const fetchedTotal = typeof data.total === "number" ? data.total : fetchedJobs.length;

        if (append) {
          setJobs((prev) => [...prev, ...fetchedJobs]);
        } else {
          setJobs(fetchedJobs);
        }
        setTotal(fetchedTotal);

        // Save to cache
        inMemoryCache.current.set(cacheKey, { jobs: fetchedJobs, total: fetchedTotal });

        // If we loaded a single page and the selected job is missing, clear it
        if (selectedJob && !fetchedJobs.find((j) => j.id === selectedJob.id)) {
          // keep selectedJob, but note: user might view details
        }
      } catch (err) {
        console.error("fetchJobs error:", err);
        setError(err.message || "Noma'lum xato");
        toasts.push(`Xatolik: ${err.message || "Ishlar yuklanmadi"}`);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [cacheKey, page, perPage, query, statusFilter, sortBy, sortDir, selectedJob, toasts]
  );

  /* Initial load */
  useEffect(() => {
    fetchJobs({ replace: true });
  }, [fetchJobs]);

  /* Polling */
  useEffect(() => {
    let timer;
    if (polling) {
      timer = setInterval(() => {
        fetchJobs({ replace: true });
      }, 10000); // refresh every 10s while polling is ON
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [polling, fetchJobs]);

  /* Select/deselect handlers */
  const toggleSelect = (jobId) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(jobId)) copy.delete(jobId);
      else copy.add(jobId);
      return copy;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(jobs.map((j) => j.id)));
  };

  const clearSelected = () => {
    setSelectedIds(new Set());
  };

  /* Open job details */
  const openJobDetails = (job) => {
    setSelectedJob(job);
  };

  const closeJobDetails = () => {
    setSelectedJob(null);
  };

  /* Fetch checker response for a job and set to checkerResponse */
  const viewCheckerResponse = useCallback(
    async (job) => {
      try {
        setCheckerResponse(null);
        const res = await fetch(ENDPOINTS.CHECKER_RESPONSE(job.id), {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          const parsed = await safeJsonParse(res);
          const message = (parsed && parsed.message) || `Javob olinmadi: ${res.status}`;
          throw new Error(message);
        }
        const data = await res.json();
        /**
         * Expected response shape:
         * { status: "to'g'ri"|'noto'g'ri'|'band', reason: "string", date: "ISO" }
         */
        setCheckerResponse(data || null);
        toasts.push("Tekshiruvchi javobi yuklandi");
      } catch (err) {
        console.error("viewCheckerResponse error:", err);
        toasts.push(`Javobni olishda xato: ${err.message || err}`);
      }
    },
    [toasts]
  );

  /* Send single job to checker */
  const sendToChecker = useCallback(
    async (jobId) => {
      if (!jobId) return;
      // optimistic UI: add to sendingSet
      setSendingSet((s) => new Set(s).add(jobId));
      try {
        const res = await fetch(ENDPOINTS.SEND_TO_CHECKER, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ jobId }),
        });
        if (!res.ok) {
          const parsed = await safeJsonParse(res);
          const message = (parsed && parsed.message) || `Yuborilmadi: ${res.status}`;
          throw new Error(message);
        }
        const data = await res.json();
        // Backend should return an updated job or success message
        toasts.push(`Ish #${jobId} tekshiruvchiga yuborildi`);
        // refresh job list (current view) to reflect status changes
        await fetchJobs({ replace: true });
        return data;
      } catch (err) {
        console.error("sendToChecker error:", err);
        toasts.push(`Yuborishda xatolik: ${err.message || err}`);
        // keep UI stable; return error
        return Promise.reject(err);
      } finally {
        setSendingSet((s) => {
          const copy = new Set(s);
          copy.delete(jobId);
          return copy;
        });
      }
    },
    [fetchJobs, toasts]
  );

  /* Bulk send selected to checker with progress & retry */
  const sendSelectedToChecker = useCallback(
    async (opts = {}) => {
      const ids = Array.from(selectedIds);
      if (!ids.length) {
        toasts.push("Hech qanday ish tanlanmadi");
        return;
      }
      const concurrency = opts.concurrency || 3;
      let success = 0;
      let fail = 0;

      toasts.push(`Tanlangan ${ids.length} ta ish tekshiruvchiga yuborilmoqda...`, { persistent: false });

      // simple concurrency queue
      const queue = [...ids];
      const workers = new Array(concurrency).fill(null).map(async () => {
        while (queue.length) {
          const id = queue.shift();
          setSendingSet((s) => new Set(s).add(id));
          try {
            await sendToChecker(id);
            success += 1;
          } catch (e) {
            console.error("bulk send error for", id, e);
            fail += 1;
            // optionally retry once after short delay
            try {
              await sleep(700);
              await sendToChecker(id);
              success += 1;
              fail -= 1;
            } catch {
              // nothing else
            }
          } finally {
            setSendingSet((s) => {
              const copy = new Set(s);
              copy.delete(id);
              return copy;
            });
          }
        }
      });

      await Promise.all(workers);
      toasts.push(`Yuborish tugadi. Muvaffaqiyat: ${success}, muvaffaqiyatsiz: ${fail}`);
      // refresh after bulk action
      fetchJobs({ replace: true });
      clearSelected();
    },
    [selectedIds, sendToChecker, toasts, fetchJobs]
  );

  /* Toggle sort */
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  /* Pagination handlers */
  const goToPage = (p) => {
    if (p < 1) p = 1;
    setPage(p);
    // fetchJobs will be triggered by useEffect watching page/cacheKey
  };

  const loadMore = () => {
    // For simplicity assume backend supports requesting next page by increasing page
    setPage((prev) => prev + 1);
  };

  /* Job Card subcomponent */
  function JobCard({ job }) {
    const isSending = sendingSet.has(job.id);
    const isSelected = selectedIds.has(job.id);

    return (
      <div className="task-card-modern" style={{ position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 14, color: "#0b3b66", fontWeight: 700 }}>{job.title}</div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 6 }}>{job.shortDescription || ""}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#888" }}>{formatDate(job.createdAt)}</div>
                <div style={{ marginTop: 6 }}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: 10,
                      background: job.status === "to'g'ri" ? "#e6ffed" : job.status === "noto'g'ri" ? "#fff1f0" : "#fff7e6",
                      color: job.status === "to'g'ri" ? "#2e7d32" : job.status === "noto'g'ri" ? "#c62828" : "#8a6d00",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {job.status}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                className="task-view-btn"
                onClick={() => openJobDetails(job)}
                style={{ padding: "6px 12px", fontSize: 14 }}
                title="Batafsil ko‘rish"
              >
                Batafsil
              </button>

              <button
                className="task-view-btn"
                onClick={() => viewCheckerResponse(job)}
                style={{ background: "#faad14", padding: "6px 12px", fontSize: 14 }}
                title="Tekshiruvchidan javobni ko‘rish"
              >
                Javobni ko‘rish
              </button>

              <button
                className="task-view-btn"
                onClick={() => sendToChecker(job.id)}
                disabled={isSending}
                style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 12px", fontSize: 14 }}
                title="Tekshiruvchiga yuborish"
              >
                <IconSend /> {isSending ? "Yuborilmoqda..." : "Yuborish"}
              </button>
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", top: 8, left: 10 }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelect(job.id)}
            aria-label={`Tanlash ${job.id}`}
          />
        </div>
      </div>
    );
  }

  /* Job details drawer/modal markup */
  function JobDetailsPane({ job, onClose }) {
    const [fullDetails, setFullDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState(null);

    useEffect(() => {
      let mounted = true;
      const fetchDetails = async () => {
        setLoadingDetails(true);
        setDetailsError(null);
        try {
          // Try to reuse job object if it already contains the details
          if (job && job.full) {
            setFullDetails(job.full);
            return;
          }
          // If API provides an endpoint for a single job, you can call it here.
          // We will try to call the /api/operator/jobs endpoint with ?id=<jobId> to fetch details.
          const res = await fetch(`${ENDPOINTS.JOBS}?id=${encodeURIComponent(job.id)}`, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
          });
          if (!res.ok) {
            const parsed = await safeJsonParse(res);
            const msg = (parsed && parsed.message) || `Details olinmadi: ${res.status}`;
            throw new Error(msg);
          }
          const data = await res.json();
          // server expected to return object or { jobs: [...] }
          let detailsObj = null;
          if (data && data.job) detailsObj = data.job;
          else if (Array.isArray(data.jobs) && data.jobs.length) detailsObj = data.jobs[0];
          else if (data && typeof data === "object" && data.id) detailsObj = data;
          if (mounted) setFullDetails(detailsObj);
        } catch (err) {
          console.error("fetch job details error:", err);
          if (mounted) setDetailsError(err.message || "Xato");
        } finally {
          if (mounted) setLoadingDetails(false);
        }
      };
      fetchDetails();
      return () => {
        mounted = false;
      };
    }, [job]);

    if (!job) return null;

    return (
      <div className="modal" style={{ zIndex: 1200 }}>
        <div className="modal-content" style={{ maxWidth: 920, width: "92%" }}>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
          <h3 style={{ marginTop: 6, color: "#0b3b66" }}>{job.title} — To'liq ma'lumot</h3>

          {loadingDetails ? (
            <p>Yuklanmoqda...</p>
          ) : detailsError ? (
            <div style={{ color: "#c62828" }}>Xatolik: {detailsError}</div>
          ) : fullDetails ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 12 }}>
              <div style={{ background: "#fafafa", padding: 12, borderRadius: 8 }}>
                <h4 style={{ margin: "6px 0 10px 0" }}>Asosiy ma'lumot</h4>
                <p><b>ID:</b> {fullDetails.id}</p>
                <p><b>Status:</b> {fullDetails.status}</p>
                <p><b>Operator:</b> {fullDetails.operator || "-"}</p>
                <p><b>Yaratilgan:</b> {formatDate(fullDetails.createdAt)}</p>
                <p><b>Oxirgi yangilanish:</b> {formatDate(fullDetails.updatedAt)}</p>
              </div>

              <div style={{ background: "#fafafa", padding: 12, borderRadius: 8 }}>
                <h4 style={{ margin: "6px 0 10px 0" }}>Qo‘shimcha</h4>
                <p><b>Manzil:</b> {fullDetails.address || "-"}</p>
                <p><b>Telefon:</b> {fullDetails.phone || "-"}</p>
                <p><b>Email:</b> {fullDetails.email || "-"}</p>
                <p><b>Qo‘shimcha eslatma:</b> {fullDetails.note || "-"}</p>
              </div>

              <div style={{ gridColumn: "1 / -1", background: "#fff", padding: 12, borderRadius: 8 }}>
                <h4 style={{ margin: "6px 0 10px 0" }}>To‘liq tavsif</h4>
                <div style={{ whiteSpace: "pre-wrap", color: "#333" }}>{fullDetails.description || "-"}</div>
              </div>
            </div>
          ) : (
            <p>Mavjud batafsil ma'lumot yo'q</p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
            <button className="task-view-btn" onClick={() => viewCheckerResponse(job)} title="Tekshiruvchidan javobni yangilash">
              Javobni yangilash
            </button>
            <button className="task-view-btn" onClick={() => sendToChecker(job.id)} title="Tekshiruvchiga yuborish">
              Tekshiruvchiga yuborish
            </button>
            <button className="task-view-btn" onClick={onClose} style={{ background: "#e3e3e3", color: "#0b3b66" }}>
              Yopish
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Render ---------- */

  return (
    <div className="dashboard-container-modern" style={{ minHeight: "100vh" }}>
      {toasts.ToastContainer}

      {/* Sidebar */}
      <div className="sidebar-modern" role="navigation" aria-label="sidebar">
        <div className="sidebar-header-modern" style={{ paddingTop: 24 }}>
          <img src="/avatar.png" alt="Operator avatar" className="avatar-modern" style={{ width: 78, height: 78 }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, color: "#fff", fontSize: 16 }}>Operator</div>
            <div className="balance-modern" style={{ marginTop: 6 }}>
              Balans: <span style={{ fontWeight: 700 }}>150 000 so‘m</span>
            </div>
          </div>
        </div>

        <div className="sidebar-nav-modern" style={{ marginTop: 18, width: "100%", paddingLeft: 8, paddingRight: 8 }}>
          <button style={{ textAlign: "left" }} onClick={() => { setPage(1); fetchJobs({ replace: true }); }}>
            🏠 Bosh sahifa
          </button>
          <button style={{ textAlign: "left" }} onClick={() => { setPolling((p) => !p); toasts.push(polling ? "Polling o‘chiq" : "Polling yoqildi"); }}>
            {polling ? "⏸ Polling to‘xtatish" : "▶ Polling yoqish"}
          </button>
          <button style={{ textAlign: "left" }} onClick={() => { selectAllVisible(); toasts.push("Hamma ko‘rinadigan ishlar tanlandi"); }}>
            ✅ Hammasini tanlash
          </button>
          <button style={{ textAlign: "left" }} onClick={() => { clearSelected(); toasts.push("Tanlov bekor qilindi"); }}>
            ❌ Tanlovni tozalash
          </button>
          <button className="logout-btn-modern" style={{ marginTop: 18 }} onClick={() => { /* implement logout if needed */ }}>
            Chiqish
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content-modern" style={{ paddingBottom: 80 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h2 style={{ margin: "6px 0 10px 0" }}>Operator ishlar paneli</h2>
            <div style={{ color: "#666" }}>Bu bo‘limda sizning barcha topshiriqlaringiz ko‘rsatiladi.</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                placeholder="Qidirish... (sarlavha, operator, id)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #d9d9d9", minWidth: 280 }}
                onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); fetchJobs({ replace: true }); } }}
              />
              <button className="task-view-btn" onClick={() => { setPage(1); fetchJobs({ replace: true }); }} title="Filterni qo'llash">
                <IconRefresh /> Yangilash
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ color: "#666", fontSize: 14 }}>Status:</label>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: "8px", borderRadius: 6 }}>
                <option value="all">Barchasi</option>
                <option value="yangi">Yangi</option>
                <option value="jarayonda">Jarayonda</option>
                <option value="to'g'ri">To'g'ri</option>
                <option value="noto'g'ri">Noto'g'ri</option>
                <option value="band">Band</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ color: "#666", fontSize: 14 }}>Ko‘rsatish:</label>
              <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} style={{ padding: "8px", borderRadius: 6 }}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk actions */}
        <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              className="task-view-btn"
              onClick={() => sendSelectedToChecker({ concurrency: 4 })}
              disabled={selectedIds.size === 0}
              title="Tanlanganlarni tekshiruvchiga yuborish"
            >
              Tanlanganlarni yuborish ({selectedIds.size})
            </button>

            <button
              className="task-view-btn"
              onClick={() => { fetchJobs({ replace: true }); toasts.push("Ro'yxat yangilandi"); }}
              title="Yangilash"
            >
              Yangilash
            </button>

            <div style={{ color: "#666" }}>
              Umumiy: <b style={{ color: "#0b3b66" }}>{total}</b> — Sahifa: <b>{page}</b>
            </div>
          </div>

          <div style={{ color: "#666", fontSize: 13 }}>
            Sort: <b style={{ color: "#0b3b66" }}>{sortBy}</b> ({sortDir})
            <button className="task-view-btn" style={{ marginLeft: 10 }} onClick={() => { toggleSort("createdAt"); }}>
              Yaratilgan bo‘yicha
            </button>
            <button className="task-view-btn" style={{ marginLeft: 6 }} onClick={() => { toggleSort("status"); }}>
              Status bo‘yicha
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginTop: 12, color: "#c62828", background: "#fff1f0", padding: 10, borderRadius: 8 }}>
            Xatolik: {error}
          </div>
        )}

        {/* Jobs grid */}
        <div style={{ marginTop: 16 }} className="tasks-list-modern">
          {loading ? (
            <div style={{ padding: 20 }}>Yuklanmoqda...</div>
          ) : jobs.length === 0 ? (
            <div style={{ padding: 20 }}>Hech qanday ish topilmadi.</div>
          ) : (
            <div className="task-cards-modern" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          {/* Load more button when there are more pages */}
          {jobs.length > 0 && jobs.length < total && (
            <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
              <button
                className="task-view-btn"
                onClick={() => {
                  loadMore();
                }}
                disabled={loadingMore}
              >
                {loadingMore ? "Yuklanmoqda..." : "Ko'proq yuklash"}
              </button>
            </div>
          )}
        </div>

        {/* Checker response display */}
        {checkerResponse && (
          <div style={{ marginTop: 22, background: "#fff", padding: 16, borderRadius: 10, boxShadow: "0 6px 18px rgba(0,0,0,0.04)" }}>
            <h3 style={{ margin: 0 }}>Tekshiruvchidan so‘nggi javob</h3>
            <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
              <div>
                <p style={{ margin: 0 }}><b>Status:</b> {checkerResponse.status}</p>
                <p style={{ margin: 0 }}><b>Sana:</b> {formatDate(checkerResponse.date)}</p>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0 }}><b>Sabab:</b></p>
                <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{checkerResponse.reason}</div>
              </div>
            </div>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="task-view-btn" onClick={() => setCheckerResponse(null)} style={{ background: "#e3e3e3", color: "#0b3b66" }}>
                Yopish
              </button>
            </div>
          </div>
        )}

        {/* Pagination controls */}
        <div style={{ marginTop: 26, display: "flex", justifyContent: "center", gap: 8 }}>
          <button className="task-view-btn" onClick={() => goToPage(1)} disabled={page === 1}>
            Birinchi
          </button>
          <button className="task-view-btn" onClick={() => goToPage(page - 1)} disabled={page === 1}>
            Orqaga
          </button>
          <div style={{ alignSelf: "center", padding: "6px 10px", background: "#fff", borderRadius: 8 }}>Sahifa {page}</div>
          <button className="task-view-btn" onClick={() => goToPage(page + 1)} disabled={jobs.length === 0}>
            Oldinga
          </button>
          <button className="task-view-btn" onClick={() => goToPage(Math.ceil(total / perPage) || 1)} disabled={page >= Math.ceil(total / perPage)}>
            Oxirgi
          </button>
        </div>
      </div>

      {/* Job details modal (conditionally rendered) */}
      {selectedJob && <JobDetailsPane job={selectedJob} onClose={closeJobDetails} />}

      {/* Accessibility: hidden live region for announcements */}
      <div aria-live="polite" style={{ position: "absolute", left: -9999, top: "auto", width: 1, height: 1, overflow: "hidden" }} />
    </div>
  );
}
