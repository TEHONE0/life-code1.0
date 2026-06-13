"use client";

// 轻量埋点：fire-and-forget，失败静默，不阻塞页面。
// 每个会话用 sessionStorage 生成一个 sid，关键事件每会话只记一次（once）。
function getSid(): string {
  try {
    let sid = sessionStorage.getItem("lc_sid");
    if (!sid) {
      sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem("lc_sid", sid);
    }
    return sid;
  } catch {
    return "no-storage";
  }
}

export function track(event: string, opts?: { once?: boolean; lang?: string }) {
  try {
    if (opts?.once) {
      const key = `lc_ev_${event}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    }
    const body = JSON.stringify({ event, session_id: getSid(), lang: opts?.lang || null });
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* 埋点失败绝不影响用户 */
  }
}
