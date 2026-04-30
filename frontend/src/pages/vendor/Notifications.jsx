import { useEffect, useMemo, useState } from "react";
import notificationService from "../../services/odoo/notificationService";

const fmt = (iso) => new Date(iso).toLocaleString("es-DO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Notifications() {
  const [rows, setRows] = useState([]);

  const load = async () => {
    const data = await notificationService.list();
    setRows(data);
  };

  useEffect(() => { load(); }, []);

  const unread = useMemo(() => rows.filter((r) => !r.read).length, [rows]);

  const markRead = async (id) => {
    await notificationService.markRead(id);
    await load();
  };

  const markAll = async () => {
    await notificationService.markAllRead();
    await load();
  };

  const remove = async (id) => {
    await notificationService.delete(id);
    await load();
  };

  return (
    <>
      <style>{`
        .nt{display:flex;flex-direction:column;gap:14px}
        .nt-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
        .nt-title{font-family:'Lexend',sans-serif;font-size:22px;font-weight:800;color:var(--vs-900)}
        .nt-sub{font-size:12.5px;color:var(--vs-500)}
        .nt-btn{padding:9px 14px;border-radius:10px;border:1.5px solid var(--vs-200);background:#fff;cursor:pointer;font-size:13px;font-weight:700;color:var(--vs-700)}
        .nt-card{background:#fff;border:1px solid var(--vs-200);border-radius:16px;overflow:hidden}
        .nt-row{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:12px 14px;border-top:1px solid var(--vs-100)}
        .nt-row:first-child{border-top:none}
        .nt-dot{width:9px;height:9px;border-radius:50%;margin-top:5px;flex-shrink:0}
        .nt-unread .nt-dot{background:#06b6d4}.nt-read .nt-dot{background:#cbd5e1}
        .nt-t{font-size:14px;font-weight:800;color:var(--vs-900)}
        .nt-b{font-size:13px;color:var(--vs-600);line-height:1.5}
        .nt-time{font-size:11px;color:var(--vs-400);margin-top:4px}
        .nt-ac{display:flex;gap:6px;flex-wrap:wrap}
        .nt-a{padding:5px 8px;border:1px solid var(--vs-200);border-radius:8px;background:#fff;font-size:11px;cursor:pointer}
        .nt-empty{padding:24px;text-align:center;color:var(--vs-400)}
      `}</style>

      <div className="nt">
        <div className="nt-h">
          <div>
            <h1 className="nt-title">Notifications</h1>
            <p className="nt-sub">Centro de notificaciones del vendedor.</p>
          </div>
          <button className="nt-btn" onClick={markAll}>Marcar todas ({unread})</button>
        </div>

        <div className="nt-card">
          {rows.length === 0 && <div className="nt-empty">No tienes notificaciones.</div>}
          {rows.map((n) => (
            <div key={n.id} className={`nt-row ${n.read ? "nt-read" : "nt-unread"}`}>
              <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 0 }}>
                <span className="nt-dot" />
                <div>
                  <div className="nt-t">{n.title}</div>
                  <div className="nt-b">{n.body}</div>
                  <div className="nt-time">{fmt(n.createdAt)}</div>
                </div>
              </div>
              <div className="nt-ac">
                {!n.read && <button className="nt-a" onClick={() => markRead(n.id)}>Leida</button>}
                <button className="nt-a" onClick={() => remove(n.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
