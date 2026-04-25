// ============================================================
//  KMERSCHOOL — Module Gestion Examens (Admin)
//  Version : 3.0 — Complet & Fonctionnel
//  Tables BD : examens, questions_examen, choix_reponses,
//              passages_examen, matieres, niveaux_scolaires,
//              series_specialites, sous_systemes, chapitres
// ============================================================

'use strict';

// ── Styles injectés une seule fois ──────────────────────────
const EXAM_CSS = `
<style id="examCss">
/* ══ PALETTE ══ */
:root {
  --ex-bg:   #f8fafc; --ex-surf: #ffffff; --ex-surf2: #f1f5f9;
  --ex-b:    #e2e8f0; --ex-b2:   #cbd5e1;
  --ex-ind:  #6366f1; --ex-em: #10b981; --ex-amb: #f59e0b;
  --ex-ros:  #f43f5e; --ex-cyan: #06b6d4; --ex-vio: #8b5cf6;
  --ex-t1:   #0f172a; --ex-t2: #475569; --ex-t3: #94a3b8;
}

/* ══ LAYOUT ══ */
.ex-wrap { font-family:'Inter',sans-serif; color:var(--ex-t1); }
.ex-topbar { display:flex;align-items:center;justify-content:space-between;
  padding:.875rem 1.25rem;background:#fff;border-bottom:1px solid var(--ex-b);
  gap:1rem;flex-wrap:wrap; }
.ex-title { font-weight:800;font-size:1.15rem;color:var(--ex-t1); }
.ex-stats { display:flex;gap:.65rem;flex-wrap:wrap; }
.ex-stat-pill { background:var(--ex-surf2);border:1px solid var(--ex-b);
  border-radius:99px;padding:.28rem .85rem;font-size:.73rem;font-weight:600;
  display:flex;align-items:center;gap:.3rem;color:var(--ex-t2); }

/* ══ TOOLBAR ══ */
.ex-toolbar { display:flex;align-items:center;gap:.65rem;padding:.875rem 1.25rem;
  background:#fff;border-bottom:1px solid var(--ex-b);flex-wrap:wrap; }
.ex-search { display:flex;align-items:center;gap:.5rem;
  background:var(--ex-surf2);border:1px solid var(--ex-b);
  border-radius:.55rem;padding:.45rem .875rem;flex:1;max-width:320px; }
.ex-search input { background:none;border:none;outline:none;
  font-size:.83rem;color:var(--ex-t1);width:100%; }
.ex-search input::placeholder { color:var(--ex-t3); }
.ex-filter-sel { background:var(--ex-surf2);border:1px solid var(--ex-b);
  border-radius:.55rem;padding:.44rem .75rem;font-size:.78rem;
  color:var(--ex-t2);outline:none;cursor:pointer; }

/* ══ EXAM GRID ══ */
.ex-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));
  gap:1rem;padding:1.25rem; }

/* ══ EXAM CARD ══ */
.ex-card { background:#fff;border:1px solid var(--ex-b);border-radius:1rem;
  overflow:hidden;transition:box-shadow .2s,border-color .2s; }
.ex-card:hover { box-shadow:0 4px 20px rgba(0,0,0,.1);border-color:var(--ex-b2); }
.ex-card-accent { height:4px; }
.ex-card-body { padding:1rem 1.1rem; }
.ex-card-footer { padding:.75rem 1.1rem;border-top:1px solid var(--ex-b);
  display:flex;align-items:center;justify-content:space-between;gap:.5rem;flex-wrap:wrap; }
.ex-badge { display:inline-flex;align-items:center;gap:.2rem;
  padding:.16rem .55rem;border-radius:99px;font-size:.65rem;font-weight:700; }
.ex-type-badge { border-radius:.4rem;padding:.2rem .55rem;font-size:.7rem;font-weight:700; }

/* ══ EMPTY STATE ══ */
.ex-empty { padding:4rem;text-align:center;color:var(--ex-t3); }
.ex-empty .ico { font-size:3.5rem;margin-bottom:.75rem; }

/* ══ BUTTONS ══ */
.btn-ex { border:none;cursor:pointer;font-family:'Inter',sans-serif;
  font-weight:600;transition:all .15s;display:inline-flex;align-items:center;gap:.4rem;
  border-radius:.6rem;font-size:.82rem; }
.btn-ex-primary { background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;
  padding:.55rem 1.2rem;box-shadow:0 2px 8px rgba(99,102,241,.3); }
.btn-ex-primary:hover { opacity:.9;transform:translateY(-1px); }
.btn-ex-primary:disabled { opacity:.5;pointer-events:none; }
.btn-ex-ghost { background:transparent;border:1px solid var(--ex-b);
  color:var(--ex-t2);padding:.48rem .95rem; }
.btn-ex-ghost:hover { border-color:var(--ex-ind);color:var(--ex-ind); }
.btn-ex-success { background:linear-gradient(135deg,#10b981,#059669);color:white;padding:.55rem 1.2rem; }
.btn-ex-danger  { background:#fff0f3;border:1px solid #fecdd3;color:#e11d48;padding:.45rem .9rem; }
.btn-ex-danger:hover  { background:#ffe4e6; }
.btn-ex-warn    { background:#fffbeb;border:1px solid #fde68a;color:#d97706;padding:.45rem .9rem; }
.btn-ex-sm { padding:.3rem .65rem!important;font-size:.73rem!important; }
.btn-ex-icon { padding:.38rem .55rem!important;background:transparent;
  border:1px solid var(--ex-b);border-radius:.45rem;font-size:.82rem;cursor:pointer;
  color:var(--ex-t2);transition:all .15s; }
.btn-ex-icon:hover { border-color:var(--ex-ind);color:var(--ex-ind); }

/* ══ MODAL OVERLAY ══ */
.ex-modal-bg { display:none;position:fixed;inset:0;z-index:1000;
  background:rgba(15,23,42,.65);backdrop-filter:blur(6px);
  align-items:flex-start;justify-content:center;padding:1.5rem;overflow-y:auto; }
.ex-modal-bg.show { display:flex; }
.ex-modal { background:#fff;border-radius:1.25rem;
  width:100%;max-width:980px;margin:auto;
  box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;position:relative; }

/* ══ WIZARD HEADER ══ */
.wiz-header { padding:1.5rem 2rem 1.25rem;border-bottom:1px solid var(--ex-b);
  background:linear-gradient(135deg,#0f172a,#1e293b); }
.wiz-title { font-weight:800;font-size:1.15rem;color:#f1f5f9;margin-bottom:1rem; }
.wiz-steps { display:flex;gap:0;position:relative; }
.wiz-step { flex:1;display:flex;flex-direction:column;align-items:center;
  gap:.35rem;position:relative;cursor:pointer; }
.wiz-step::before { content:'';position:absolute;top:14px;left:calc(-50% + 14px);
  right:calc(50% + 14px);height:2px;background:rgba(255,255,255,.15); }
.wiz-step:first-child::before { display:none; }
.wiz-step-num { width:28px;height:28px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:.72rem;font-weight:800;position:relative;z-index:1;
  background:rgba(255,255,255,.1);color:rgba(255,255,255,.4);
  border:2px solid rgba(255,255,255,.15);transition:all .25s; }
.wiz-step.active .wiz-step-num { background:var(--ex-ind);color:#fff;border-color:var(--ex-ind);
  box-shadow:0 0 0 4px rgba(99,102,241,.3); }
.wiz-step.done .wiz-step-num { background:var(--ex-em);color:#fff;border-color:var(--ex-em); }
.wiz-step.active::before { background:var(--ex-ind); }
.wiz-step.done::before { background:var(--ex-em); }
.wiz-step-label { font-size:.65rem;font-weight:600;color:rgba(255,255,255,.35);
  text-align:center;max-width:80px;line-height:1.3;transition:color .25s; }
.wiz-step.active .wiz-step-label { color:rgba(255,255,255,.85); }
.wiz-step.done .wiz-step-label { color:rgba(255,255,255,.55); }

/* ══ WIZARD BODY ══ */
.wiz-body { padding:1.75rem 2rem;min-height:460px;overflow-y:auto;max-height:calc(100vh - 300px); }
.wiz-footer { padding:1rem 2rem;border-top:1px solid var(--ex-b);
  display:flex;align-items:center;justify-content:space-between;gap:1rem; }
.wiz-footer-left { display:flex;align-items:center;gap:.75rem; }
.wiz-footer-right { display:flex;align-items:center;gap:.75rem; }

/* ══ FORM ELEMENTS ══ */
.ex-form-row { display:grid;grid-template-columns:1fr 1fr;gap:.875rem; }
.ex-form-row-3 { display:grid;grid-template-columns:1fr 1fr 1fr;gap:.875rem; }
.ex-form-group { display:flex;flex-direction:column;gap:.35rem;margin-bottom:.875rem; }
.ex-form-group:last-child { margin-bottom:0; }
.ex-label { font-size:.73rem;font-weight:700;color:var(--ex-t2);
  display:flex;align-items:center;gap:.35rem; }
.ex-label .req { color:var(--ex-ros); }
.ex-input { background:var(--ex-surf2);border:1px solid var(--ex-b);
  border-radius:.6rem;padding:.6rem .875rem;font-size:.85rem;color:var(--ex-t1);
  outline:none;width:100%;transition:border-color .2s,box-shadow .2s;
  font-family:'Inter',sans-serif; }
.ex-input:focus { border-color:var(--ex-ind);box-shadow:0 0 0 3px rgba(99,102,241,.12); }
.ex-input::placeholder { color:var(--ex-t3); }
.ex-select { background:var(--ex-surf2);border:1px solid var(--ex-b);
  border-radius:.6rem;padding:.6rem .875rem;font-size:.85rem;color:var(--ex-t1);
  outline:none;width:100%;cursor:pointer;
  appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right .875rem center;padding-right:2.25rem; }
.ex-select:focus { border-color:var(--ex-ind); }
.ex-textarea { background:var(--ex-surf2);border:1px solid var(--ex-b);
  border-radius:.6rem;padding:.6rem .875rem;font-size:.85rem;color:var(--ex-t1);
  outline:none;width:100%;resize:vertical;min-height:80px;
  font-family:'Inter',sans-serif;transition:border-color .2s; }
.ex-textarea:focus { border-color:var(--ex-ind); }
.ex-hint { font-size:.68rem;color:var(--ex-t3);line-height:1.4; }
.ex-section-title { font-size:.7rem;font-weight:800;letter-spacing:.1em;
  text-transform:uppercase;color:var(--ex-t3);margin:1.25rem 0 .75rem;
  padding-bottom:.35rem;border-bottom:1px solid var(--ex-b);
  display:flex;align-items:center;gap:.4rem; }
.ex-divider { border:none;border-top:1px solid var(--ex-b);margin:1rem 0; }

/* ══ TOGGLE SWITCHES ══ */
.toggle-row { display:flex;align-items:center;justify-content:space-between;
  padding:.65rem .875rem;background:var(--ex-surf2);border:1px solid var(--ex-b);
  border-radius:.65rem;margin-bottom:.5rem; }
.toggle-info { flex:1; }
.toggle-name { font-size:.82rem;font-weight:600;color:var(--ex-t1); }
.toggle-desc { font-size:.7rem;color:var(--ex-t3);margin-top:.1rem; }
.toggle-sw { position:relative;width:40px;height:22px;flex-shrink:0; }
.toggle-sw input { opacity:0;width:0;height:0;position:absolute; }
.toggle-slider { position:absolute;inset:0;background:#cbd5e1;border-radius:99px;
  cursor:pointer;transition:background .2s; }
.toggle-slider::before { content:'';position:absolute;width:16px;height:16px;
  border-radius:50%;background:#fff;top:3px;left:3px;transition:transform .2s;
  box-shadow:0 1px 3px rgba(0,0,0,.2); }
.toggle-sw input:checked + .toggle-slider { background:var(--ex-ind); }
.toggle-sw input:checked + .toggle-slider::before { transform:translateX(18px); }
.toggle-row.on { background:rgba(99,102,241,.05);border-color:rgba(99,102,241,.25); }

/* ══ PROCTORING SECTION ══ */
.proct-card { border:2px solid var(--ex-b);border-radius:.875rem;overflow:hidden;margin-bottom:.65rem; }
.proct-card-header { display:flex;align-items:center;gap:.75rem;
  padding:.875rem 1rem;background:var(--ex-surf2);cursor:pointer; }
.proct-card-header .pico { width:36px;height:36px;border-radius:.55rem;
  display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0; }
.proct-card-body { padding:1rem;display:none; }
.proct-card.open .proct-card-body { display:block; }
.proct-card.open { border-color:var(--ex-ind); }
.proct-card.active-proct { border-color:var(--ex-em); }
.proct-card.active-proct .proct-card-header { background:rgba(16,185,129,.06); }

/* ══ QUESTIONS LIST ══ */
.q-list { display:flex;flex-direction:column;gap:.65rem; }
.q-item { background:#fff;border:1.5px solid var(--ex-b);border-radius:.875rem;
  overflow:hidden;transition:border-color .15s; }
.q-item:hover { border-color:var(--ex-b2); }
.q-item.dragging { opacity:.5;border-style:dashed; }
.q-item-header { display:flex;align-items:center;gap:.75rem;padding:.875rem 1rem;
  cursor:pointer; }
.q-drag-handle { color:var(--ex-t3);cursor:grab;font-size:1rem;padding:.25rem; }
.q-num-badge { width:26px;height:26px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:.7rem;font-weight:800;flex-shrink:0; }
.q-item-title { flex:1;font-size:.85rem;font-weight:600;color:var(--ex-t1);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.q-item-meta { display:flex;align-items:center;gap:.4rem;flex-shrink:0;flex-wrap:wrap; }
.q-item-body { padding:.875rem 1rem;border-top:1px solid var(--ex-b);display:none; }
.q-item.open .q-item-body { display:block; }
.q-item.open { border-color:var(--ex-ind); }

/* ══ QUESTION FORM ══ */
.qtype-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.5rem; }
.qtype-opt { padding:.65rem .75rem;border:1.5px solid var(--ex-b);
  border-radius:.65rem;cursor:pointer;text-align:center;transition:all .2s; }
.qtype-opt:hover { border-color:var(--ex-ind);background:rgba(99,102,241,.04); }
.qtype-opt.sel { border-color:var(--ex-ind);background:rgba(99,102,241,.08); }
.qtype-opt .qt-ico { font-size:1.35rem;margin-bottom:.3rem; }
.qtype-opt .qt-lbl { font-size:.7rem;font-weight:700;color:var(--ex-t1); }
.qtype-opt .qt-sub { font-size:.62rem;color:var(--ex-t3);margin-top:.1rem; }
.qtype-opt.sel .qt-lbl { color:var(--ex-ind); }

/* ══ CHOICES EDITOR ══ */
.choices-list { display:flex;flex-direction:column;gap:.4rem; }
.choice-row { display:flex;align-items:center;gap:.5rem; }
.choice-correct-btn { width:28px;height:28px;border-radius:50%;flex-shrink:0;
  border:2px solid var(--ex-b2);background:transparent;cursor:pointer;
  display:flex;align-items:center;justify-content:center;font-size:.8rem;
  transition:all .15s;color:transparent; }
.choice-correct-btn.correct { background:var(--ex-em);border-color:var(--ex-em);
  color:#fff;box-shadow:0 0 0 3px rgba(16,185,129,.2); }
.choice-correct-btn:not(.correct):hover { border-color:var(--ex-em);color:var(--ex-em); }
.choice-input { flex:1;background:var(--ex-surf2);border:1px solid var(--ex-b);
  border-radius:.5rem;padding:.48rem .7rem;font-size:.82rem;color:var(--ex-t1);
  outline:none; }
.choice-input.correct-inp { border-color:var(--ex-em);background:rgba(16,185,129,.05); }
.choice-del-btn { background:none;border:none;cursor:pointer;color:var(--ex-t3);
  font-size:.85rem;padding:.2rem;transition:color .15s; }
.choice-del-btn:hover { color:var(--ex-ros); }

/* ══ SITUATION PROBLÈME ══ */
.sit-part { background:var(--ex-surf2);border:1px solid var(--ex-b);
  border-radius:.75rem;padding:1rem;margin-bottom:.65rem; }
.sit-part-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:.65rem; }
.sit-part-title { font-size:.78rem;font-weight:700;color:var(--ex-t2); }
.sub-q-list { display:flex;flex-direction:column;gap:.45rem; }
.sub-q-row { display:flex;align-items:flex-start;gap:.5rem; }
.sub-q-num { width:22px;height:22px;border-radius:50%;
  background:rgba(99,102,241,.12);color:var(--ex-ind);
  display:flex;align-items:center;justify-content:center;
  font-size:.65rem;font-weight:800;flex-shrink:0;margin-top:4px; }
.sub-q-input { flex:1;background:#fff;border:1px solid var(--ex-b);
  border-radius:.5rem;padding:.45rem .7rem;font-size:.82rem;
  color:var(--ex-t1);outline:none;resize:vertical;min-height:40px; }
.sub-q-pts { width:56px;background:#fff;border:1px solid var(--ex-b);
  border-radius:.5rem;padding:.45rem .5rem;font-size:.82rem;
  color:var(--ex-t1);outline:none;text-align:center; }

/* ══ PREVIEW PANEL ══ */
.preview-pill { display:flex;align-items:center;gap:.4rem;
  background:rgba(99,102,241,.08);border:1px solid rgba(99,102,241,.2);
  border-radius:.5rem;padding:.35rem .75rem;font-size:.75rem;
  font-weight:600;color:var(--ex-ind); }

/* ══ SECURITY LEVEL INDICATOR ══ */
.sec-meter { display:flex;gap:3px;margin-top:.5rem; }
.sec-seg { flex:1;height:5px;border-radius:99px;background:var(--ex-b);transition:background .3s; }
.sec-label { font-size:.72rem;font-weight:700;margin-top:.35rem; }

/* ══ TABS ══ */
.ex-tabs { display:flex;gap:0;border-bottom:2px solid var(--ex-b);margin-bottom:1.25rem; }
.ex-tab { padding:.65rem 1.1rem;font-size:.82rem;font-weight:600;
  color:var(--ex-t3);cursor:pointer;border-bottom:2px solid transparent;
  margin-bottom:-2px;transition:all .15s; }
.ex-tab:hover { color:var(--ex-ind); }
.ex-tab.active { color:var(--ex-ind);border-bottom-color:var(--ex-ind); }

/* ══ STATUS BADGES ══ */
.status-publie   { background:#dcfce7;color:#166534; }
.status-brouillon{ background:#fff7ed;color:#9a3412; }
.status-actif    { background:#dbeafe;color:#1e40af; }

/* ══ DRAG OVER ══ */
.q-list.drag-over { background:rgba(99,102,241,.04);border-radius:.75rem; }

/* ══ SPINNER ══ */
@keyframes exSpin { to { transform:rotate(360deg); } }
.ex-spinner { width:14px;height:14px;border:2px solid rgba(99,102,241,.2);
  border-top-color:var(--ex-ind);border-radius:50%;animation:exSpin .6s linear infinite; }
.ex-spinner-white { border:2px solid rgba(255,255,255,.3);border-top-color:#fff; }

/* ══ TOAST ══ */
.ex-toast-area { position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;
  display:flex;flex-direction:column;gap:.4rem;align-items:flex-end; }
.ex-toast { padding:.55rem 1.25rem;border-radius:.7rem;font-size:.82rem;
  font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.15);
  animation:exToastIn .25s ease both;max-width:340px; }
@keyframes exToastIn { from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)} }
.ex-toast.success { background:#f0fdf4;border:1px solid #bbf7d0;color:#166534; }
.ex-toast.error   { background:#fff0f3;border:1px solid #fecdd3;color:#9f1239; }
.ex-toast.info    { background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af; }
.ex-toast.warn    { background:#fffbeb;border:1px solid #fde68a;color:#92400e; }

/* ══ RESPONSIVE ══ */
@media(max-width:700px){
  .ex-form-row,.ex-form-row-3 { grid-template-columns:1fr; }
  .wiz-body { padding:1.25rem; }
  .qtype-grid { grid-template-columns:1fr 1fr; }
  .ex-grid { grid-template-columns:1fr; }
}
</style>`;

// ── Constantes ──────────────────────────────────────────────
const TYPE_CFG = {
    evaluation: { label: 'Évaluation', icon: '📋', color: '#6366f1', bg: 'rgba(99,102,241,.12)' },
    controle: { label: 'Contrôle', icon: '✏️', color: '#10b981', bg: 'rgba(16,185,129,.12)' },
    devoir: { label: 'Devoir', icon: '📝', color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
    composition: { label: 'Composition', icon: '📚', color: '#8b5cf6', bg: 'rgba(139,92,246,.12)' },
    examen_blanc: { label: 'Examen blanc', icon: '🎯', color: '#ec4899', bg: 'rgba(236,72,153,.12)' },
    test: { label: 'Test rapide', icon: '⚡', color: '#06b6d4', bg: 'rgba(6,182,212,.12)' },
};

const Q_TYPES = [
    { id: 'qcm_unique', icon: '◉', label: 'QCM — 1 réponse', sub: 'Choix unique', color: '#6366f1' },
    { id: 'qcm_multiple', icon: '☑', label: 'QCM — plusieurs', sub: 'Choix multiples', color: '#8b5cf6' },
    { id: 'vrai_faux', icon: '⚖', label: 'Vrai / Faux', sub: 'Vrai ou Faux', color: '#06b6d4' },
    { id: 'texte_court', icon: '✏', label: 'Réponse courte', sub: 'Quelques mots/lignes', color: '#10b981' },
    { id: 'texte_long', icon: '📄', label: 'Réponse rédigée', sub: 'Paragraphes développés', color: '#f59e0b' },
    { id: 'situation', icon: '🔬', label: 'Situation-problème', sub: 'Contexte + sous-questions', color: '#f43f5e' },
    { id: 'calcul', icon: '🔢', label: 'Exercice de calcul', sub: 'Maths / Physique / Chimie', color: '#ec4899' },
    { id: 'schema_annote', icon: '🖼', label: 'Schéma annoté', sub: 'Image + annotations', color: '#f97316' },
];

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// ── Utilitaires ──────────────────────────────────────────────
function uid() { return 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7); }
function escHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function formatDuration(min) { if (min >= 60) return `${Math.floor(min / 60)}h${min % 60 ? String(min % 60).padStart(2, '0') + 'min' : ''}`; return `${min} min`; }
function today() { return new Date().toISOString().slice(0, 16); }

// ── Classe principale ────────────────────────────────────────
export class ExamensView {

    constructor() {
        this._inited = false;
        this._editId = null;
        this._wiz = { step: 1, questions: [], changed: false };
        this._refs = {};       // data references
        this._autosaveTimer = null;
    }

    // ══════════════════════════════
    //  INIT
    // ══════════════════════════════
    async render() {
        if (!document.getElementById('examCss')) document.head.insertAdjacentHTML('beforeend', EXAM_CSS);
        if (!document.getElementById('exToastArea')) {
            const ta = document.createElement('div');
            ta.id = 'exToastArea'; ta.className = 'ex-toast-area';
            document.body.appendChild(ta);
        }

        const container = document.getElementById('examensContentArea');
        if (!container) return;

        container.innerHTML = `<div class="ex-wrap">
      ${this._buildTopBar()}
      ${this._buildToolbar()}
      <div id="exCatalog"></div>
    </div>`;

        // Fetch refs in parallel
        await this._fetchRefs();
        await this._loadCatalog();
        this._bindToolbar();
    }

    // ══════════════════════════════
    //  FETCH REFERENCE DATA
    // ══════════════════════════════
    async _fetchRefs() {
        const api = this._getApi();
        const [mats, niveaux, series, sousSys] = await Promise.all([
            api.from('matieres').select('id,nom,slug,couleur').order('nom'),
            api.from('niveaux_scolaires').select('id,nom_fr,nom_court,code').order('ordre'),
            api.from('series_specialites').select('id,code,nom_court,nom_fr,niveau_id').order('nom_fr'),
            api.from('sous_systemes').select('id,code,nom_fr').eq('actif', true).order('nom_fr'),
        ]);
        this._refs = {
            matieres: mats.data || [],
            niveaux: niveaux.data || [],
            series: series.data || [],
            sousSys: sousSys.data || [],
        };
    }

    // ══════════════════════════════
    //  LOAD CATALOG
    // ══════════════════════════════
    async _loadCatalog() {
        const api = this._getApi();
        const filterType = document.getElementById('exFilterType')?.value || 'all';
        const filterMatId = document.getElementById('exFilterMat')?.value || 'all';
        const searchQ = document.getElementById('exSearch')?.value?.toLowerCase().trim() || '';

        let q = api.from('examens')
            .select(`id,titre,description,type_examen,duree_minutes,note_totale,note_passage,nombre_questions,est_publie,est_actif,questions_aleatoires,created_at,
               matiere:matieres(id,nom,couleur),
               niveau:niveaux_scolaires(nom_court),
               serie:series_specialites(nom_court),
               sous_systeme:sous_systemes(code,nom_fr)`)
            .order('created_at', { ascending: false });

        if (filterType !== 'all') q = q.eq('type_examen', filterType);
        if (filterMatId !== 'all') q = q.eq('matiere_id', filterMatId);

        const { data: examens, error } = await q;
        if (error) { this._toast('Erreur chargement: ' + error.message, 'error'); return; }

        // Passages count
        const ids = (examens || []).map(e => e.id);
        let passagesMap = {};
        if (ids.length) {
            const { data: pass } = await api.from('passages_examen').select('examen_id,est_reussi').in('examen_id', ids);
            (pass || []).forEach(p => {
                if (!passagesMap[p.examen_id]) passagesMap[p.examen_id] = { total: 0, reussis: 0 };
                passagesMap[p.examen_id].total++;
                if (p.est_reussi) passagesMap[p.examen_id].reussis++;
            });
        }

        let list = examens || [];
        if (searchQ) list = list.filter(e =>
            e.titre?.toLowerCase().includes(searchQ) ||
            e.matiere?.nom?.toLowerCase().includes(searchQ) ||
            e.type_examen?.includes(searchQ)
        );

        // Stats bar
        this._renderStats(list);
        this._renderGrid(list, passagesMap);
    }

    _renderStats(list) {
        const publie = list.filter(e => e.est_publie).length;
        const total_q = list.reduce((s, e) => s + (e.nombre_questions || 0), 0);
        document.getElementById('exTopStats').innerHTML = [
            { ico: '📝', val: list.length, lbl: 'examens' },
            { ico: '✅', val: publie, lbl: 'publiés' },
            { ico: '❓', val: total_q, lbl: 'questions' },
        ].map(s => `<div class="ex-stat-pill">${s.ico} <strong>${s.val}</strong> <span style="font-weight:400">${s.lbl}</span></div>`).join('');
    }

    _renderGrid(list, passagesMap) {
        const cat = document.getElementById('exCatalog');
        if (!list.length) {
            cat.innerHTML = `<div class="ex-empty"><div class="ico">📝</div>
        <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:.4rem">Aucun examen</h3>
        <p style="font-size:.85rem;color:#94a3b8">Créez votre premier examen avec le bouton ci-dessus.</p></div>`;
            return;
        }
        cat.innerHTML = `<div class="ex-grid">${list.map(e => this._renderCard(e, passagesMap[e.id] || { total: 0, reussis: 0 })).join('')}</div>`;
    }

    _renderCard(e, pass) {
        const cfg = TYPE_CFG[e.type_examen] || TYPE_CFG.test;
        const statut = e.est_publie
            ? `<span class="ex-badge status-publie">✅ Publié</span>`
            : `<span class="ex-badge status-brouillon">📋 Brouillon</span>`;
        const matBadge = e.matiere
            ? `<span class="ex-badge" style="background:${e.matiere.couleur || '#e2e8f0'}22;color:${e.matiere.couleur || '#475569'}">${e.matiere.nom}</span>` : '';
        const niv = e.niveau?.nom_court ? `<span class="ex-badge" style="background:#dbeafe;color:#1e40af">${e.niveau.nom_court}</span>` : '';
        const sys = e.sous_systeme?.code ? `<span class="ex-badge" style="background:#f0fdf4;color:#166534">${e.sous_systeme.code === 'francophone' ? '🇫🇷 FR' : '🇬🇧 EN'}</span>` : '';
        const passInfo = pass.total > 0
            ? `<span style="font-size:.72rem;color:#94a3b8">👤 ${pass.total} passage${pass.total > 1 ? 's' : ''} · ${pass.reussis} réussi${pass.reussis > 1 ? 's' : ''}</span>`
            : `<span style="font-size:.72rem;color:#cbd5e1">Aucun passage</span>`;

        return `<div class="ex-card" id="excard-${e.id}">
      <div class="ex-card-accent" style="background:${cfg.color}"></div>
      <div class="ex-card-body">
        <div style="display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;margin-bottom:.65rem">
          <span class="ex-type-badge" style="background:${cfg.bg};color:${cfg.color}">${cfg.icon} ${cfg.label}</span>
          ${matBadge}${niv}${sys}${statut}
        </div>
        <div style="font-weight:700;font-size:.95rem;color:#0f172a;margin-bottom:.35rem;line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${escHtml(e.titre)}</div>
        ${e.description ? `<div style="font-size:.76rem;color:#94a3b8;line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;margin-bottom:.5rem">${escHtml(e.description)}</div>` : ''}
        <div style="display:flex;flex-wrap:wrap;gap:.5rem;font-size:.73rem;color:#64748b">
          <span>⏱ ${formatDuration(e.duree_minutes || 0)}</span>
          <span>❓ ${e.nombre_questions || 0} questions</span>
          <span>📊 /${e.note_totale || 20}</span>
          ${e.questions_aleatoires ? '<span>🔀 Aléatoire</span>' : ''}
        </div>
      </div>
      <div class="ex-card-footer">
        ${passInfo}
        <div style="display:flex;gap:.35rem">
          <button class="btn-ex-icon" onclick="window.ExMgr.previewExamen(${e.id})" title="Aperçu">👁</button>
          <button class="btn-ex-icon" onclick="window.ExMgr.editExamen(${e.id})" title="Modifier">✏️</button>
          <button class="btn-ex-icon" onclick="window.ExMgr.togglePublish(${e.id},${!e.est_publie})" title="${e.est_publie ? 'Dépublier' : 'Publier'}">
            ${e.est_publie ? '📤' : '📢'}
          </button>
          <button class="btn-ex-icon" onclick="window.ExMgr.deleteExamen(${e.id},'${escHtml(e.titre)}')" title="Supprimer">🗑</button>
        </div>
      </div>
    </div>`;
    }

    // ══════════════════════════════
    //  TOP BAR & TOOLBAR HTML
    // ══════════════════════════════
    _buildTopBar() {
        return `<div class="ex-topbar">
      <div>
        <div class="ex-title">📝 Gestion des Examens</div>
        <div style="font-size:.73rem;color:#94a3b8;margin-top:.15rem">Créer, éditer et gérer tous types d'évaluations</div>
      </div>
      <div id="exTopStats" class="ex-stats"></div>
      <button class="btn-ex btn-ex-primary" onclick="window.ExMgr.openWizard()">
        ＋ Nouvel examen
      </button>
    </div>`;
    }

    _buildToolbar() {
        const matOpts = `<option value="all">Toutes matières</option>`;
        return `<div class="ex-toolbar">
      <div class="ex-search">
        <svg width="14" height="14" fill="none" stroke="#94a3b8" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input id="exSearch" type="text" placeholder="Rechercher un examen…" oninput="window.ExMgr._loadCatalog()"/>
      </div>
      <select id="exFilterType" class="ex-filter-sel" onchange="window.ExMgr._loadCatalog()">
        <option value="all">Tous types</option>
        ${Object.entries(TYPE_CFG).map(([k, v]) => `<option value="${k}">${v.icon} ${v.label}</option>`).join('')}
      </select>
      <select id="exFilterMat" class="ex-filter-sel" onchange="window.ExMgr._loadCatalog()">
        ${matOpts}
      </select>
    </div>`;
    }

    _bindToolbar() {
        const matSel = document.getElementById('exFilterMat');
        if (matSel) {
            matSel.innerHTML = `<option value="all">Toutes matières</option>` +
                (this._refs.matieres || []).map(m => `<option value="${m.id}">${m.nom}</option>`).join('');
        }
    }

    // ══════════════════════════════════════════════════════════
    //  WIZARD — OUVERTURE / NAVIGATION
    // ══════════════════════════════════════════════════════════
    openWizard(examData = null) {
        this._editId = examData?.id || null;
        this._wiz = {
            step: 1,
            questions: examData?._questions || [],
            changed: false,
            data: examData || {},
            security: examData?._security || {
                webcam: false, full_screen: false, change_tab: false, copy_paste: false,
                right_click: false, face_detect: false, proctored: false,
                max_infraction: 3, time_limit_per_q: false
            }
        };

        // Build modal
        if (!document.getElementById('exWizModal')) {
            const m = document.createElement('div');
            m.id = 'exWizModal'; m.className = 'ex-modal-bg';
            m.innerHTML = `<div class="ex-modal"><div id="exWizInner"></div></div>`;
            document.body.appendChild(m);
        }

        document.getElementById('exWizModal').classList.add('show');
        document.body.style.overflow = 'hidden';
        this._renderWiz();
    }

    closeWizard() {
        if (this._wiz.changed) {
            if (!confirm('Des modifications non sauvegardées. Quitter quand même ?')) return;
        }
        document.getElementById('exWizModal')?.classList.remove('show');
        document.body.style.overflow = '';
        clearInterval(this._autosaveTimer);
    }

    _renderWiz() {
        const { step } = this._wiz;
        const steps = [
            { num: 1, label: 'Infos & Configuration' },
            { num: 2, label: 'Sécurité & Proctoring' },
            { num: 3, label: 'Questions & Barème' },
        ];
        const stepsHtml = steps.map(s => `
      <div class="wiz-step ${step === s.num ? 'active' : step > s.num ? 'done' : ''}" onclick="window.ExMgr._goStep(${s.num})">
        <div class="wiz-step-num">${step > s.num ? '✓' : s.num}</div>
        <div class="wiz-step-label">${s.label}</div>
      </div>`).join('');

        document.getElementById('exWizInner').innerHTML = `
      <div class="wiz-header">
        <div class="wiz-title">${this._editId ? '✏️ Modifier l\'examen' : '＋ Créer un nouvel examen'}</div>
        <div class="wiz-steps">${stepsHtml}</div>
      </div>
      <div class="wiz-body" id="wizBody">${this._renderWizStep(step)}</div>
      <div class="wiz-footer">
        <div class="wiz-footer-left">
          <button class="btn-ex btn-ex-ghost" onclick="window.ExMgr.closeWizard()">✕ Annuler</button>
          ${step > 1 ? `<button class="btn-ex btn-ex-ghost" onclick="window.ExMgr._goStep(${step - 1})">← Précédent</button>` : ''}
        </div>
        <div class="wiz-footer-right">
          <div id="wizAutoSaveInfo" style="font-size:.72rem;color:#94a3b8"></div>
          ${step < 3
                ? `<button class="btn-ex btn-ex-primary" onclick="window.ExMgr._nextStep()">Suivant →</button>`
                : `<button class="btn-ex btn-ex-ghost" id="wizSaveDraftBtn" onclick="window.ExMgr.saveExam(false)">💾 Brouillon</button>
               <button class="btn-ex btn-ex-success" id="wizPublishBtn" onclick="window.ExMgr.saveExam(true)">📢 Sauver & Publier</button>`
            }
        </div>
      </div>`;
        this._bindWizStep(step);
    }

    _goStep(n) {
        if (n > this._wiz.step && !this._validateStep(this._wiz.step)) return;
        this._captureStep(this._wiz.step);
        this._wiz.step = n;
        this._renderWiz();
    }

    _nextStep() {
        if (!this._validateStep(this._wiz.step)) return;
        this._captureStep(this._wiz.step);
        this._wiz.step++;
        this._renderWiz();
    }

    // ══════════════════════════════
    //  STEP 1 — INFOS & CONFIG
    // ══════════════════════════════
    _renderWizStep(step) {
        if (step === 1) return this._stepConfig();
        if (step === 2) return this._stepSecurity();
        if (step === 3) return this._stepQuestions();
        return '';
    }

    _stepConfig() {
        const d = this._wiz.data || {};
        const matOpts = (this._refs.matieres || []).map(m => `<option value="${m.id}" ${d.matiere_id == m.id ? 'selected' : ''}>${m.nom}</option>`).join('');
        const niveauOpts = (this._refs.niveaux || []).map(n => `<option value="${n.id}" ${d.niveau_id == n.id ? 'selected' : ''}>${n.nom_court || n.code} — ${n.nom_fr}</option>`).join('');
        const serieOpts = (this._refs.series || []).map(s => `<option value="${s.id}" ${d.serie_id == s.id ? 'selected' : ''}>${s.nom_court} — ${s.nom_fr}</option>`).join('');
        const sysOpts = (this._refs.sousSys || []).map(s => `<option value="${s.id}" ${d.sous_systeme_id == s.id ? 'selected' : ''}>${s.nom_fr}</option>`).join('');

        return `
    <div class="ex-section-title">🎯 Type d'examen</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.5rem;margin-bottom:1.25rem">
      ${Object.entries(TYPE_CFG).map(([k, v]) => `
        <label class="wiz-type-lbl" style="display:flex;flex-direction:column;align-items:center;gap:.35rem;
          padding:.65rem .5rem;border:1.5px solid ${d.type_examen === k ? v.color : '#e2e8f0'};
          border-radius:.75rem;cursor:pointer;transition:all .2s;
          background:${d.type_examen === k ? v.bg : 'transparent'};text-align:center">
          <input type="radio" name="wiz_type" value="${k}" style="display:none" ${d.type_examen === k ? 'checked' : ''} onchange="window.ExMgr._updateTypeUI(this)"/>
          <span style="font-size:1.4rem">${v.icon}</span>
          <span class="wiz-type-text" style="font-size:.72rem;font-weight:700;color:${d.type_examen === k ? v.color : '#475569'}">${v.label}</span>
        </label>`).join('')}
    </div>

    <div class="ex-section-title">📋 Informations générales</div>
    <div class="ex-form-group">
      <label class="ex-label">Titre de l'examen <span class="req">*</span></label>
      <input id="wTitre" class="ex-input" type="text" placeholder="Ex: Composition de Mathématiques — Terminale C" value="${escHtml(d.titre || '')}"/>
    </div>
    <div class="ex-form-group">
      <label class="ex-label">Description / Instructions pour les élèves</label>
      <textarea id="wDesc" class="ex-textarea" rows="2" placeholder="Instructions générales, matériel autorisé, recommandations…">${escHtml(d.description || '')}</textarea>
    </div>

    <div class="ex-form-row">
      <div class="ex-form-group">
        <label class="ex-label">Matière</label>
        <select id="wMatiere" class="ex-select"><option value="">— Choisir —</option>${matOpts}</select>
      </div>
      <div class="ex-form-group">
        <label class="ex-label">Sous-système</label>
        <select id="wSousSys" class="ex-select"><option value="">— Choisir —</option>${sysOpts}</select>
      </div>
    </div>
    <div class="ex-form-row">
      <div class="ex-form-group">
        <label class="ex-label">Niveau scolaire</label>
        <select id="wNiveau" class="ex-select"><option value="">— Choisir —</option>${niveauOpts}</select>
      </div>
      <div class="ex-form-group">
        <label class="ex-label">Série / Spécialité</label>
        <select id="wSerie" class="ex-select"><option value="">— Toutes —</option>${serieOpts}</select>
      </div>
    </div>

    <div class="ex-section-title">⏱ Durée & Notation</div>
    <div class="ex-form-row-3">
      <div class="ex-form-group">
        <label class="ex-label">Durée (minutes) <span class="req">*</span></label>
        <input id="wDuree" class="ex-input" type="number" min="5" max="300" placeholder="Ex: 120" value="${d.duree_minutes || ''}"/>
      </div>
      <div class="ex-form-group">
        <label class="ex-label">Barème total</label>
        <input id="wNoteTotal" class="ex-input" type="number" min="1" max="100" value="${d.note_totale || 20}"/>
      </div>
      <div class="ex-form-group">
        <label class="ex-label">Note de passage</label>
        <input id="wNotePassage" class="ex-input" type="number" min="0" step="0.5" value="${d.note_passage || 10}"/>
      </div>
    </div>

    <div class="ex-section-title">📅 Planification (optionnel)</div>
    <div class="ex-form-row">
      <div class="ex-form-group">
        <label class="ex-label">Ouverture</label>
        <input id="wDateDebut" class="ex-input" type="datetime-local" value="${d.date_debut ? d.date_debut.slice(0, 16) : ''}"/>
      </div>
      <div class="ex-form-group">
        <label class="ex-label">Fermeture</label>
        <input id="wDateFin" class="ex-input" type="datetime-local" value="${d.date_fin ? d.date_fin.slice(0, 16) : ''}"/>
      </div>
    </div>

    <div class="ex-section-title">⚙️ Paramètres de passage</div>
    <div class="ex-form-row">
      <div class="ex-form-group">
        <label class="ex-label">Tentatives max <span title="0 = illimité" style="cursor:help">ℹ</span></label>
        <input id="wTentatives" class="ex-input" type="number" min="0" max="10" value="${d.nombre_tentatives_max || 1}"/>
      </div>
      <div class="ex-form-group">
        <label class="ex-label">Délai entre tentatives (min)</label>
        <input id="wDelai" class="ex-input" type="number" min="0" value="${d.delai_entre_tentatives || 0}"/>
      </div>
    </div>
    <div>
      ${this._toggleHtml('wQAlea', 'Questions aléatoires', 'Mélanger l\'ordre des questions pour chaque élève', d.questions_aleatoires)}
      ${this._toggleHtml('wCAlea', 'Choix aléatoires', 'Mélanger les options de réponse pour les QCM', d.choix_aleatoires)}
      ${this._toggleHtml('wAffCorr', 'Afficher la correction', 'Montrer les bonnes réponses après soumission', d.afficher_correction !== false)}
      ${this._toggleHtml('wAffNote', 'Afficher la note', 'Montrer la note immédiatement après', d.afficher_note !== false)}
      ${this._toggleHtml('wAffCorrige', 'Afficher le corrigé après', 'Donner accès au corrigé complet après l\'épreuve', d.afficher_corrige_apres !== false)}
    </div>`;
    }

    // ══════════════════════════════
    //  STEP 2 — SÉCURITÉ & PROCTORING
    // ══════════════════════════════
    _updateTypeUI(radio) {
        if (!this._wiz.data) this._wiz.data = {};
        this._wiz.data.type_examen = radio.value;
        const typesCfg = TYPE_CFG;
        
        document.querySelectorAll('input[name="wiz_type"]').forEach(inp => {
            const lbl = inp.parentElement;
            const k = inp.value;
            const cfg = typesCfg[k];
            
            if (inp.checked) {
                lbl.style.borderColor = cfg.color;
                lbl.style.background = cfg.bg;
                lbl.querySelector('.wiz-type-text').style.color = cfg.color;
            } else {
                lbl.style.borderColor = '#e2e8f0';
                lbl.style.background = 'transparent';
                lbl.querySelector('.wiz-type-text').style.color = '#475569';
            }
        });
    }
    _stepSecurity() {
        const sec = this._wiz.security || {};
        return `
    <div class="ex-section-title">🛡 Niveau de sécurité</div>
    <div style="margin-bottom:1rem">
      <div id="secMeterBar" class="sec-meter">
        <div class="sec-seg" id="ss1"></div><div class="sec-seg" id="ss2"></div>
        <div class="sec-seg" id="ss3"></div><div class="sec-seg" id="ss4"></div><div class="sec-seg" id="ss5"></div>
      </div>
      <div class="sec-label" id="secLabel" style="color:#94a3b8">Aucune sécurité activée</div>
    </div>

    <div class="ex-section-title">👁 Télésurveillance (Proctoring)</div>

    <div class="proct-card ${sec.webcam ? 'open active-proct' : ''}" id="pcard-webcam">
      <div class="proct-card-header" onclick="window.ExMgr._toggleProctCard('webcam')">
        <div class="pico" style="background:rgba(99,102,241,.1)">📸</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:.85rem;color:#0f172a">Surveillance webcam</div>
          <div style="font-size:.72rem;color:#94a3b8">Enregistre des snapshots réguliers via la webcam de l'élève</div>
        </div>
        <label class="toggle-sw" onclick="event.stopPropagation()">
          <input type="checkbox" id="swWebcam" ${sec.webcam ? 'checked' : ''} onchange="window.ExMgr._updateSecMeter()"/>
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="proct-card-body">
        <div class="ex-form-row">
          <div class="ex-form-group">
            <label class="ex-label">Fréquence snapshot (secondes)</label>
            <input id="wSnapFreq" class="ex-input" type="number" min="10" max="300" value="${sec.snap_freq || 30}"/>
          </div>
          <div class="ex-form-group">
            <label class="ex-label">Nombre max infractions</label>
            <input id="wMaxInfrac" class="ex-input" type="number" min="1" max="20" value="${sec.max_infraction || 5}"/>
          </div>
        </div>
        ${this._toggleHtml('wFaceDetect', 'Détection visage', 'Alerte si aucun visage détecté dans le cadre', sec.face_detect)}
        ${this._toggleHtml('wMultiFace', 'Détecter plusieurs visages', 'Alerte si plusieurs personnes sont visibles', sec.multi_face || false)}
      </div>
    </div>

    <div class="proct-card ${sec.full_screen ? 'open active-proct' : ''}">
      <div class="proct-card-header" onclick="this.closest('.proct-card').classList.toggle('open')">
        <div class="pico" style="background:rgba(16,185,129,.1)">🖥</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:.85rem;color:#0f172a">Mode plein écran forcé</div>
          <div style="font-size:.72rem;color:#94a3b8">L'élève doit passer l'examen en plein écran</div>
        </div>
        <label class="toggle-sw" onclick="event.stopPropagation()">
          <input type="checkbox" id="swFullScreen" ${sec.full_screen ? 'checked' : ''} onchange="window.ExMgr._updateSecMeter()"/>
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="proct-card-body">
        ${this._toggleHtml('wAutoSubmitFS', 'Soumettre si quitte le plein écran', 'Soumettre automatiquement si l\'élève sort du plein écran', sec.auto_submit_fs || false)}
      </div>
    </div>

    <div class="proct-card ${sec.change_tab ? 'open active-proct' : ''}">
      <div class="proct-card-header" onclick="this.closest('.proct-card').classList.toggle('open')">
        <div class="pico" style="background:rgba(245,158,11,.1)">🔀</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:.85rem;color:#0f172a">Détection changement d'onglet</div>
          <div style="font-size:.72rem;color:#94a3b8">Détecter si l'élève quitte l'onglet de l'examen</div>
        </div>
        <label class="toggle-sw" onclick="event.stopPropagation()">
          <input type="checkbox" id="swChangeTab" ${sec.change_tab ? 'checked' : ''} onchange="window.ExMgr._updateSecMeter()"/>
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="proct-card-body">
        <div class="ex-form-group">
          <label class="ex-label">Infractions avant soumission forcée</label>
          <input id="wTabInfrac" class="ex-input" type="number" min="1" max="10" value="${sec.tab_infrac || 3}"/>
        </div>
        ${this._toggleHtml('wAutoSubmitTab', 'Soumettre après X infractions', 'Soumettre automatiquement après le seuil', sec.auto_submit_tab || false)}
      </div>
    </div>

    <div class="ex-section-title">🚫 Restrictions d'usage</div>
    ${this._toggleHtml('swCopyPaste', 'Désactiver Copier/Coller', 'Empêcher Ctrl+C, Ctrl+V dans le navigateur', sec.copy_paste)}
    ${this._toggleHtml('swRightClick', 'Désactiver clic droit', 'Empêcher le menu contextuel', sec.right_click)}
    ${this._toggleHtml('swDevTools', 'Bloquer les DevTools', 'Détecter l\'ouverture des outils développeur', sec.dev_tools || false)}
    ${this._toggleHtml('swTimerPerQ', 'Chrono par question', 'Chaque question a son propre chronomètre', sec.time_limit_per_q)}

    <div class="ex-section-title">⏰ Gestion du temps</div>
    ${this._toggleHtml('swAutoSubmit', 'Soumission automatique', 'Soumettre automatiquement quand le temps est écoulé', sec.auto_submit !== false)}
    ${this._toggleHtml('swWarnTime', 'Alerte temps restant', 'Afficher une alerte à 10 minutes et 2 minutes restantes', sec.warn_time !== false)}
    ${this._toggleHtml('swSaveAuto', 'Sauvegarde automatique', 'Sauvegarder les réponses toutes les 30 secondes', sec.save_auto !== false)}`;
    }

    _toggleProctCard(key) {
        const card = document.getElementById('pcard-' + key);
        if (card) card.classList.toggle('open');
    }

    _updateSecMeter() {
        const ids = ['swWebcam', 'swFullScreen', 'swChangeTab', 'swCopyPaste', 'swRightClick', 'swDevTools', 'swFaceDetect', 'swTimerPerQ', 'swAutoSubmit', 'wFaceDetect'];
        let score = 0;
        ids.forEach(id => { const el = document.getElementById(id); if (el?.checked) score++; });
        const pct = Math.min(5, Math.round(score / 2));
        const colors = ['#e2e8f0', '#f59e0b', '#f59e0b', '#f97316', '#f43f5e', '#6366f1'];
        const labels = ['Aucune sécurité', 'Sécurité minimale', 'Sécurité de base', 'Sécurité modérée', 'Sécurité élevée', 'Sécurité maximale'];
        for (let i = 1; i <= 5; i++) {
            const seg = document.getElementById('ss' + i);
            if (seg) seg.style.background = i <= pct ? colors[pct] : '#e2e8f0';
        }
        const lbl = document.getElementById('secLabel');
        if (lbl) { lbl.textContent = labels[pct]; lbl.style.color = colors[pct]; }
    }

    // ══════════════════════════════
    //  STEP 3 — QUESTIONS & BARÈME
    // ══════════════════════════════
    _stepQuestions() {
        const total = this._computeTotalPoints();
        const count = this._wiz.questions.length;
        return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem">
      <div>
        <span style="font-weight:700;font-size:.95rem;color:#0f172a">${count} question${count !== 1 ? 's' : ''}</span>
        <span style="font-size:.8rem;color:#94a3b8;margin-left:.5rem">· Total barème: <strong style="color:#6366f1">${total} pts</strong></span>
      </div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        <button class="btn-ex btn-ex-ghost btn-ex-sm" onclick="window.ExMgr._addQuestion('qcm_unique')">＋ QCM</button>
        <button class="btn-ex btn-ex-ghost btn-ex-sm" onclick="window.ExMgr._addQuestion('texte_long')">＋ Rédigé</button>
        <button class="btn-ex btn-ex-ghost btn-ex-sm" onclick="window.ExMgr._addQuestion('situation')">＋ Situation</button>
        <button class="btn-ex btn-ex-ghost btn-ex-sm" onclick="window.ExMgr._addQuestion('calcul')">＋ Calcul</button>
        <button class="btn-ex btn-ex-primary btn-ex-sm" onclick="window.ExMgr._openAddQuestionModal()">＋ Choisir type</button>
      </div>
    </div>
    <div class="q-list" id="qList" ondragover="window.ExMgr._onDragOver(event)" ondrop="window.ExMgr._onDrop(event)">
      ${this._wiz.questions.map((q, i) => this._renderQItem(q, i)).join('')}
    </div>
    ${!count ? `<div style="text-align:center;padding:2.5rem;color:#94a3b8;border:2px dashed #e2e8f0;border-radius:1rem;margin-top:.5rem">
      <div style="font-size:2.5rem;margin-bottom:.5rem">❓</div>
      <div style="font-weight:600">Aucune question encore</div>
      <div style="font-size:.82rem;margin-top:.25rem">Utilisez les boutons ci-dessus pour ajouter des questions</div>
    </div>`: ''}`;
    }

    _computeTotalPoints() {
        return (this._wiz.questions || []).reduce((s, q) => {
            if (q.type_question === 'situation' || q.type_question === 'calcul') {
                return s + (q.sub_questions || []).reduce((ss, sq) => ss + parseFloat(sq.pts || 0), 0);
            }
            return s + parseFloat(q.points || 0);
        }, 0);
    }

    _renderQItem(q, i) {
        const qtCfg = Q_TYPES.find(t => t.id === q.type_question) || { icon: '❓', label: q.type_question, color: '#94a3b8' };
        const pts = q.type_question === 'situation' || q.type_question === 'calcul'
            ? (q.sub_questions || []).reduce((s, sq) => s + parseFloat(sq.pts || 0), 0)
            : parseFloat(q.points || 0);
        const preview = (q.question_texte || '').slice(0, 80) + (q.question_texte?.length > 80 ? '…' : '');
        const choiceCount = q.choix?.length || 0;

        return `<div class="q-item" id="qitem-${q._uid}" draggable="true"
       ondragstart="window.ExMgr._onDragStart(event,'${q._uid}')">
      <div class="q-item-header" onclick="window.ExMgr._toggleQItem('${q._uid}')">
        <span class="q-drag-handle">⠿</span>
        <div class="q-num-badge" style="background:${qtCfg.color}20;color:${qtCfg.color}">${i + 1}</div>
        <div class="q-item-title">${preview || '<em style="color:#94a3b8">Question sans texte</em>'}</div>
        <div class="q-item-meta">
          <span class="ex-badge" style="background:${qtCfg.color}18;color:${qtCfg.color}">${qtCfg.icon} ${qtCfg.label}</span>
          <span class="ex-badge" style="background:#fff7ed;color:#d97706">⭐ ${pts} pt${pts !== 1 ? 's' : ''}</span>
          ${choiceCount ? `<span class="ex-badge" style="background:#f0fdf4;color:#166534">${choiceCount} choix</span>` : ''}
        </div>
        <div style="display:flex;gap:.25rem">
          <button class="btn-ex-icon" onclick="event.stopPropagation();window.ExMgr._moveQ('${q._uid}',-1)" title="Monter">↑</button>
          <button class="btn-ex-icon" onclick="event.stopPropagation();window.ExMgr._moveQ('${q._uid}',1)" title="Descendre">↓</button>
          <button class="btn-ex-icon" onclick="event.stopPropagation();window.ExMgr._duplicateQ('${q._uid}')" title="Dupliquer">⧉</button>
          <button class="btn-ex-icon" onclick="event.stopPropagation();window.ExMgr._deleteQ('${q._uid}')" title="Supprimer" style="color:#e11d48">🗑</button>
        </div>
      </div>
      <div class="q-item-body" id="qbody-${q._uid}">${this._renderQForm(q)}</div>
    </div>`;
    }

    _renderQForm(q) {
        const t = q.type_question;

        let specificHtml = '';

        if (t === 'qcm_unique' || t === 'qcm_multiple') {
            specificHtml = this._renderChoicesEditor(q);
        } else if (t === 'vrai_faux') {
            specificHtml = `<div class="ex-form-group">
        <label class="ex-label">La réponse correcte est</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">
          <label style="display:flex;align-items:center;gap:.5rem;padding:.55rem .875rem;border:1.5px solid ${q._vf === 'vrai' ? '#10b981' : '#e2e8f0'};border-radius:.6rem;cursor:pointer;background:${q._vf === 'vrai' ? 'rgba(16,185,129,.08)' : 'transparent'}">
            <input type="radio" name="vf_${q._uid}" value="vrai" ${q._vf === 'vrai' ? 'checked' : ''} onchange="window.ExMgr._setVF('${q._uid}','vrai')"/> ✅ Vrai
          </label>
          <label style="display:flex;align-items:center;gap:.5rem;padding:.55rem .875rem;border:1.5px solid ${q._vf === 'faux' ? '#f43f5e' : '#e2e8f0'};border-radius:.6rem;cursor:pointer;background:${q._vf === 'faux' ? 'rgba(244,63,94,.08)' : 'transparent'}">
            <input type="radio" name="vf_${q._uid}" value="faux" ${q._vf === 'faux' ? 'checked' : ''} onchange="window.ExMgr._setVF('${q._uid}','faux')"/> ❌ Faux
          </label>
        </div>
      </div>`;
        } else if (t === 'texte_court') {
            specificHtml = `<div class="ex-form-group">
        <label class="ex-label">Réponse attendue (référence de correction)</label>
        <input class="ex-input" type="text" placeholder="Réponse de référence pour la correction…" value="${escHtml(q.reponse_ref || '')}"
          oninput="window.ExMgr._setQField('${q._uid}','reponse_ref',this.value)"/>
      </div>`;
        } else if (t === 'texte_long') {
            specificHtml = `
      <div class="ex-form-group">
        <label class="ex-label">Critères / Guide de correction <span style="color:#94a3b8">(pour l'admin)</span></label>
        <textarea class="ex-textarea" rows="3" placeholder="Éléments de réponse attendus, critères d'évaluation, barème détaillé…"
          oninput="window.ExMgr._setQField('${q._uid}','criteres',this.value)">${escHtml(q.criteres || '')}</textarea>
      </div>`;
        } else if (t === 'situation' || t === 'calcul') {
            specificHtml = this._renderSituationEditor(q);
        } else if (t === 'schema_annote') {
            specificHtml = `<div class="ex-form-group">
        <label class="ex-label">URL du schéma / image <span class="req">*</span></label>
        <input class="ex-input" type="url" placeholder="https://…" value="${escHtml(q.image_url || '')}"
          oninput="window.ExMgr._setQField('${q._uid}','image_url',this.value)"/>
        <div class="ex-hint">L'élève annotera ce schéma dans sa réponse</div>
      </div>`;
        }

        return `<div>
      <div class="ex-form-row">
        <div class="ex-form-group" style="grid-column:1/-1">
          <label class="ex-label">Texte de la question <span class="req">*</span></label>
          <textarea class="ex-textarea" rows="${t === 'situation' || t === 'calcul' ? 4 : 2}"
            placeholder="${t === 'situation' ? 'Décrivez le contexte de la situation-problème (données, document de départ, mise en scène)…' : t === 'calcul' ? 'Énoncé complet du problème de calcul (formules, données, graphiques en URL)…' : 'Texte de la question…'}"
            oninput="window.ExMgr._setQField('${q._uid}','question_texte',this.value)">${escHtml(q.question_texte || '')}</textarea>
        </div>
      </div>
      <div class="ex-form-row">
        <div class="ex-form-group">
          <label class="ex-label">Image / Schéma (URL)</label>
          <input class="ex-input" type="url" placeholder="https://… (optionnel)" value="${escHtml(q.image_url || '')}"
            oninput="window.ExMgr._setQField('${q._uid}','image_url',this.value)"/>
        </div>
        ${t !== 'situation' && t !== 'calcul' ? `<div class="ex-form-group">
          <label class="ex-label">Points</label>
          <input class="ex-input" type="number" min="0.5" step="0.5" value="${q.points || 1}"
            oninput="window.ExMgr._setQField('${q._uid}','points',parseFloat(this.value)||1);window.ExMgr._refreshQHeader('${q._uid}')"/>
        </div>`: ''}
      </div>
      ${specificHtml}
      <div class="ex-form-group" style="margin-top:.5rem">
        <label class="ex-label">💡 Explication / Corrigé détaillé</label>
        <textarea class="ex-textarea" rows="2" placeholder="Explication complète affichée après correction…"
          oninput="window.ExMgr._setQField('${q._uid}','explication',this.value)">${escHtml(q.explication || '')}</textarea>
      </div>
    </div>`;
    }

    _renderChoicesEditor(q) {
        const choices = q.choix || [];
        const isMultiple = q.type_question === 'qcm_multiple';
        const rows = choices.map((c, ci) => `
      <div class="choice-row" id="choicerow-${q._uid}-${ci}">
        <button class="choice-correct-btn ${c.est_correct ? 'correct' : ''}" title="${isMultiple ? 'Cocher si correct' : 'Réponse correcte'}"
          onclick="window.ExMgr._toggleChoiceCorrect('${q._uid}',${ci},${isMultiple})">✓</button>
        <input class="choice-input ${c.est_correct ? 'correct-inp' : ''}" type="text" placeholder="Option ${LETTERS[ci]}"
          value="${escHtml(c.texte_choix || '')}"
          oninput="window.ExMgr._setChoiceText('${q._uid}',${ci},this.value)"/>
        <button class="choice-del-btn" onclick="window.ExMgr._removeChoice('${q._uid}',${ci})">✕</button>
      </div>`).join('');

        return `<div class="ex-form-group">
      <label class="ex-label">${isMultiple ? 'Réponses (cochez toutes les bonnes)' : 'Choix de réponse (cochez la bonne réponse)'}</label>
      <div class="choices-list" id="choiceslist-${q._uid}">${rows}</div>
      <button type="button" class="btn-ex btn-ex-ghost btn-ex-sm" style="margin-top:.5rem"
        onclick="window.ExMgr._addChoice('${q._uid}')">＋ Ajouter un choix</button>
    </div>`;
    }

    _renderSituationEditor(q) {
        const subQs = q.sub_questions || [];
        const isSit = q.type_question === 'situation';
        return `
    <div class="ex-form-group">
      <label class="ex-label">${isSit ? '📊 Données / Documents (texte, tableaux, graphiques)' : '📐 Données numériques et formules'}</label>
      <textarea class="ex-textarea" rows="4" placeholder="${isSit ? 'Ex: Tableau de données, extrait de document, graphique (utilisez l\'URL image plus haut)…' : 'Ex: Formules à utiliser, constantes, tableau de valeurs…'}"
        oninput="window.ExMgr._setQField('${q._uid}','donnees',this.value)">${escHtml(q.donnees || '')}</textarea>
    </div>
    <div class="ex-form-group">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">
        <label class="ex-label" style="margin:0">${isSit ? 'Sous-questions' : 'Questions du problème'} 
          <span style="color:#94a3b8">(chacune a son barème)</span></label>
        <button class="btn-ex btn-ex-ghost btn-ex-sm" onclick="window.ExMgr._addSubQ('${q._uid}')">＋ Ajouter</button>
      </div>
      <div class="sub-q-list" id="subqlist-${q._uid}">
        ${subQs.map((sq, si) => `
          <div class="sub-q-row" id="subqrow-${q._uid}-${si}">
            <div class="sub-q-num">${si + 1}</div>
            <textarea class="sub-q-input" rows="2" placeholder="Texte de la sous-question ${si + 1}…"
              oninput="window.ExMgr._setSubQ('${q._uid}',${si},'q',this.value)">${escHtml(sq.q || '')}</textarea>
            <input class="sub-q-pts" type="number" min="0.5" step="0.5" placeholder="pts" value="${sq.pts || 1}"
              oninput="window.ExMgr._setSubQ('${q._uid}',${si},'pts',parseFloat(this.value)||1);window.ExMgr._refreshQHeader('${q._uid}')"/>
            <button class="btn-ex-icon" onclick="window.ExMgr._removeSubQ('${q._uid}',${si})">✕</button>
          </div>`).join('')}
      </div>
    </div>
    <div class="ex-form-group">
      <label class="ex-label">Correction détaillée de la situation</label>
      <textarea class="ex-textarea" rows="3" placeholder="Correction complète avec démarche et calculs…"
        oninput="window.ExMgr._setQField('${q._uid}','correction_situation',this.value)">${escHtml(q.correction_situation || '')}</textarea>
    </div>`;
    }

    // ══════════════════════════════
    //  MODAL CHOIX TYPE QUESTION
    // ══════════════════════════════
    _openAddQuestionModal() {
        let modalEl = document.getElementById('exQTypeModal');
        if (!modalEl) {
            modalEl = document.createElement('div');
            modalEl.id = 'exQTypeModal'; modalEl.className = 'ex-modal-bg';
            modalEl.innerHTML = `<div class="ex-modal" style="max-width:640px">
        <div style="padding:1.5rem 1.75rem;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between">
          <h3 style="font-weight:700;font-size:1rem;color:#0f172a">Choisir le type de question</h3>
          <button class="btn-ex-icon" onclick="document.getElementById('exQTypeModal').classList.remove('show')">✕</button>
        </div>
        <div style="padding:1.5rem">
          <div class="qtype-grid">
            ${Q_TYPES.map(t => `
              <div class="qtype-opt" onclick="window.ExMgr._addQuestion('${t.id}');document.getElementById('exQTypeModal').classList.remove('show')">
                <div class="qt-ico">${t.icon}</div>
                <div class="qt-lbl">${t.label}</div>
                <div class="qt-sub">${t.sub}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
            document.body.appendChild(modalEl);
        }
        modalEl.classList.add('show');
    }

    // ══════════════════════════════
    //  QUESTION CRUD
    // ══════════════════════════════
    _addQuestion(type = 'qcm_unique') {
        const newQ = {
            _uid: uid(),
            _isNew: true,
            type_question: type,
            question_texte: '',
            points: 1,
            ordre: this._wiz.questions.length + 1,
            explication: '',
            image_url: '',
            video_url: '',
            choix: (type === 'qcm_unique' || type === 'qcm_multiple')
                ? [{ texte_choix: '', est_correct: false, ordre: 1 }, { texte_choix: '', est_correct: false, ordre: 2 },
                { texte_choix: '', est_correct: false, ordre: 3 }, { texte_choix: '', est_correct: false, ordre: 4 }]
                : [],
            sub_questions: (type === 'situation' || type === 'calcul') ? [{ q: '', pts: 1 }, { q: '', pts: 1 }] : [],
            _vf: null, donnees: '', criteres: '', reponse_ref: '', correction_situation: ''
        };
        this._wiz.questions.push(newQ);
        this._wiz.changed = true;
        this._refreshQList();
        // Auto-open the new question
        setTimeout(() => this._toggleQItem(newQ._uid, true), 50);
    }

    _deleteQ(uid) {
        if (!confirm('Supprimer cette question ?')) return;
        this._wiz.questions = this._wiz.questions.filter(q => q._uid !== uid);
        this._wiz.changed = true;
        this._refreshQList();
    }

    _duplicateQ(uid) {
        const q = this._wiz.questions.find(q => q._uid === uid);
        if (!q) return;
        const copy = JSON.parse(JSON.stringify(q));
        copy._uid = window.uid?.() || this._genUid();
        copy._isNew = true;
        const idx = this._wiz.questions.findIndex(q => q._uid === uid);
        this._wiz.questions.splice(idx + 1, 0, copy);
        this._wiz.changed = true;
        this._refreshQList();
    }

    _genUid() { return 'q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7); }

    _moveQ(uid, dir) {
        const qs = this._wiz.questions;
        const i = qs.findIndex(q => q._uid === uid);
        const j = i + dir;
        if (j < 0 || j >= qs.length) return;
        [qs[i], qs[j]] = [qs[j], qs[i]];
        this._wiz.changed = true;
        this._refreshQList();
    }

    _toggleQItem(uid, forceOpen = false) {
        const body = document.getElementById('qbody-' + uid);
        const item = document.getElementById('qitem-' + uid);
        if (!body || !item) return;
        const open = forceOpen || !item.classList.contains('open');
        item.classList.toggle('open', open);
    }

    _refreshQList() {
        const list = document.getElementById('qList');
        if (!list) return;
        const total = this._computeTotalPoints();
        list.innerHTML = this._wiz.questions.map((q, i) => this._renderQItem(q, i)).join('');
        // Update header stats
        document.querySelector('[id="wizBody"] > div > span')?.textContent;
        // Re-render full step to update counter
        document.getElementById('wizBody').innerHTML = this._stepQuestions();
    }

    _refreshQHeader(uid) {
        // Re-render just the header of this question item to update pts
        const q = this._wiz.questions.find(q => q._uid === uid);
        if (!q) return;
        const metaEl = document.querySelector(`#qitem-${uid} .q-item-meta`);
        if (!metaEl) return;
        const pts = q.type_question === 'situation' || q.type_question === 'calcul'
            ? (q.sub_questions || []).reduce((s, sq) => s + parseFloat(sq.pts || 0), 0)
            : parseFloat(q.points || 0);
        const ptsBadge = metaEl.querySelector('[style*="amber"], [style*="f97316"], [style*="d97706"]');
        if (ptsBadge) ptsBadge.textContent = `⭐ ${pts} pt${pts !== 1 ? 's' : ''}`;
    }

    // ══════════════════════════════
    //  FIELD SETTERS
    // ══════════════════════════════
    _setQField(uid, field, val) {
        const q = this._wiz.questions.find(q => q._uid === uid);
        if (q) { q[field] = val; this._wiz.changed = true; }
    }
    _setVF(uid, val) {
        const q = this._wiz.questions.find(q => q._uid === uid);
        if (q) { q._vf = val; this._wiz.changed = true; }
    }
    _setChoiceText(uid, ci, val) {
        const q = this._wiz.questions.find(q => q._uid === uid);
        if (q?.choix?.[ci]) { q.choix[ci].texte_choix = val; this._wiz.changed = true; }
    }
    _toggleChoiceCorrect(uid, ci, isMultiple) {
        const q = this._wiz.questions.find(q => q._uid === uid);
        if (!q?.choix) return;
        if (!isMultiple) q.choix.forEach((c, i) => c.est_correct = i === ci);
        else q.choix[ci].est_correct = !q.choix[ci].est_correct;
        this._wiz.changed = true;
        // Re-render choices editor
        const listEl = document.getElementById('choiceslist-' + uid);
        if (listEl) listEl.innerHTML = q.choix.map((c, ci2) => `
      <div class="choice-row" id="choicerow-${uid}-${ci2}">
        <button class="choice-correct-btn ${c.est_correct ? 'correct' : ''}"
          onclick="window.ExMgr._toggleChoiceCorrect('${uid}',${ci2},${isMultiple})">✓</button>
        <input class="choice-input ${c.est_correct ? 'correct-inp' : ''}" type="text"
          value="${escHtml(c.texte_choix || '')}" placeholder="Option ${LETTERS[ci2]}"
          oninput="window.ExMgr._setChoiceText('${uid}',${ci2},this.value)"/>
        <button class="choice-del-btn" onclick="window.ExMgr._removeChoice('${uid}',${ci2})">✕</button>
      </div>`).join('');
    }
    _addChoice(uid) {
        const q = this._wiz.questions.find(q => q._uid === uid);
        if (!q) return;
        if (!q.choix) q.choix = [];
        q.choix.push({ texte_choix: '', est_correct: false, ordre: q.choix.length + 1 });
        this._wiz.changed = true;
        const listEl = document.getElementById('choiceslist-' + uid);
        if (listEl) {
            const ci = q.choix.length - 1;
            const row = document.createElement('div');
            row.className = 'choice-row'; row.id = `choicerow-${uid}-${ci}`;
            row.innerHTML = `<button class="choice-correct-btn" onclick="window.ExMgr._toggleChoiceCorrect('${uid}',${ci},${q.type_question === 'qcm_multiple'})">✓</button>
        <input class="choice-input" type="text" placeholder="Option ${LETTERS[ci] || ci + 1}"
          oninput="window.ExMgr._setChoiceText('${uid}',${ci},this.value)"/>
        <button class="choice-del-btn" onclick="window.ExMgr._removeChoice('${uid}',${ci})">✕</button>`;
            listEl.appendChild(row);
        }
    }
    _removeChoice(uid, ci) {
        const q = this._wiz.questions.find(q => q._uid === uid);
        if (!q?.choix || q.choix.length <= 2) { this._toast('Minimum 2 choix requis', 'warn'); return; }
        q.choix.splice(ci, 1);
        this._wiz.changed = true;
        const listEl = document.getElementById('choiceslist-' + uid);
        if (listEl) listEl.innerHTML = q.choix.map((c, ci2) => `
      <div class="choice-row"><button class="choice-correct-btn ${c.est_correct ? 'correct' : ''}"
        onclick="window.ExMgr._toggleChoiceCorrect('${uid}',${ci2},${q.type_question === 'qcm_multiple'})">✓</button>
        <input class="choice-input ${c.est_correct ? 'correct-inp' : ''}" type="text"
          value="${escHtml(c.texte_choix || '')}" placeholder="Option ${LETTERS[ci2] || ci2 + 1}"
          oninput="window.ExMgr._setChoiceText('${uid}',${ci2},this.value)"/>
        <button class="choice-del-btn" onclick="window.ExMgr._removeChoice('${uid}',${ci2})">✕</button>
      </div>`).join('');
    }
    _addSubQ(uid) {
        const q = this._wiz.questions.find(q => q._uid === uid);
        if (!q) return;
        if (!q.sub_questions) q.sub_questions = [];
        q.sub_questions.push({ q: '', pts: 1 });
        this._wiz.changed = true;
        const listEl = document.getElementById('subqlist-' + uid);
        if (listEl) {
            const si = q.sub_questions.length - 1;
            const row = document.createElement('div');
            row.className = 'sub-q-row'; row.id = `subqrow-${uid}-${si}`;
            row.innerHTML = `<div class="sub-q-num">${si + 1}</div>
        <textarea class="sub-q-input" rows="2" placeholder="Sous-question ${si + 1}…"
          oninput="window.ExMgr._setSubQ('${uid}',${si},'q',this.value)"></textarea>
        <input class="sub-q-pts" type="number" min="0.5" step="0.5" value="1"
          oninput="window.ExMgr._setSubQ('${uid}',${si},'pts',parseFloat(this.value)||1);window.ExMgr._refreshQHeader('${uid}')"/>
        <button class="btn-ex-icon" onclick="window.ExMgr._removeSubQ('${uid}',${si})">✕</button>`;
            listEl.appendChild(row);
        }
    }
    _setSubQ(uid, si, field, val) {
        const q = this._wiz.questions.find(q => q._uid === uid);
        if (q?.sub_questions?.[si]) { q.sub_questions[si][field] = val; this._wiz.changed = true; }
    }
    _removeSubQ(uid, si) {
        const q = this._wiz.questions.find(q => q._uid === uid);
        if (!q?.sub_questions || q.sub_questions.length <= 1) { this._toast('Minimum 1 sous-question', 'warn'); return; }
        q.sub_questions.splice(si, 1);
        this._wiz.changed = true;
        const listEl = document.getElementById('subqlist-' + uid);
        if (listEl) listEl.innerHTML = q.sub_questions.map((sq, si2) => `
      <div class="sub-q-row"><div class="sub-q-num">${si2 + 1}</div>
        <textarea class="sub-q-input" rows="2"
          oninput="window.ExMgr._setSubQ('${uid}',${si2},'q',this.value)">${escHtml(sq.q || '')}</textarea>
        <input class="sub-q-pts" type="number" min="0.5" step="0.5" value="${sq.pts || 1}"
          oninput="window.ExMgr._setSubQ('${uid}',${si2},'pts',parseFloat(this.value)||1);window.ExMgr._refreshQHeader('${uid}')"/>
        <button class="btn-ex-icon" onclick="window.ExMgr._removeSubQ('${uid}',${si2})">✕</button>
      </div>`).join('');
    }

    // ══════════════════════════════
    //  DRAG & DROP
    // ══════════════════════════════
    _onDragStart(e, uid) { e.dataTransfer.setData('text/plain', uid); }
    _onDragOver(e) { e.preventDefault(); document.getElementById('qList')?.classList.add('drag-over'); }
    _onDrop(e) {
        e.preventDefault();
        document.getElementById('qList')?.classList.remove('drag-over');
        const uid = e.dataTransfer.getData('text/plain');
        const target = e.target.closest('.q-item');
        if (!target || target.id === 'qitem-' + uid) return;
        const targetUid = target.id.replace('qitem-', '');
        const qs = this._wiz.questions;
        const fromIdx = qs.findIndex(q => q._uid === uid);
        const toIdx = qs.findIndex(q => q._uid === targetUid);
        if (fromIdx < 0 || toIdx < 0) return;
        const [item] = qs.splice(fromIdx, 1);
        qs.splice(toIdx, 0, item);
        this._wiz.changed = true;
        this._refreshQList();
    }

    // ══════════════════════════════
    //  CAPTURE & VALIDATE STEPS
    // ══════════════════════════════
    _captureStep(step) {
        if (step === 1) {
            const d = this._wiz.data;
            d.type_examen = document.querySelector('input[name="wiz_type"]:checked')?.value || d.type_examen;
            d.titre = document.getElementById('wTitre') ? document.getElementById('wTitre').value.trim() : (d.titre || '');
            d.description = document.getElementById('wDesc') ? document.getElementById('wDesc').value.trim() : (d.description || null);
            d.matiere_id = document.getElementById('wMatiere') ? document.getElementById('wMatiere').value : (d.matiere_id || null);
            d.sous_systeme_id = document.getElementById('wSousSys') ? document.getElementById('wSousSys').value : (d.sous_systeme_id || null);
            d.niveau_id = document.getElementById('wNiveau') ? document.getElementById('wNiveau').value : (d.niveau_id || null);
            d.serie_id = document.getElementById('wSerie') ? document.getElementById('wSerie').value : (d.serie_id || null);
            d.duree_minutes = document.getElementById('wDuree') ? parseInt(document.getElementById('wDuree').value) || 60 : (d.duree_minutes || 60);
            d.note_totale = document.getElementById('wNoteTotal') ? parseInt(document.getElementById('wNoteTotal').value) || 20 : (d.note_totale || 20);
            d.note_passage = document.getElementById('wNotePassage') ? parseFloat(document.getElementById('wNotePassage').value) || 10 : (d.note_passage || 10);
            d.nombre_tentatives_max = document.getElementById('wTentatives') ? parseInt(document.getElementById('wTentatives').value) || 1 : (d.nombre_tentatives_max || 1);
            d.delai_entre_tentatives = document.getElementById('wDelai') ? parseInt(document.getElementById('wDelai').value) || 0 : (d.delai_entre_tentatives || 0);
            d.date_debut = document.getElementById('wDateDebut') ? document.getElementById('wDateDebut').value : (d.date_debut || null);
            d.date_fin = document.getElementById('wDateFin') ? document.getElementById('wDateFin').value : (d.date_fin || null);
            
            if (document.getElementById('wQAlea')) d.questions_aleatoires = document.getElementById('wQAlea').checked;
            if (document.getElementById('wCAlea')) d.choix_aleatoires = document.getElementById('wCAlea').checked;
            if (document.getElementById('wAffCorr')) d.afficher_correction = document.getElementById('wAffCorr').checked;
            if (document.getElementById('wAffNote')) d.afficher_note = document.getElementById('wAffNote').checked;
            if (document.getElementById('wAffCorrige')) d.afficher_corrige_apres = document.getElementById('wAffCorrige').checked;
        }
        if (step === 2) {
            const s = this._wiz.security;
            const g = id => document.getElementById(id)?.checked || false;
            const gi = id => parseInt(document.getElementById(id)?.value) || 0;
            s.webcam = g('swWebcam');
            s.full_screen = g('swFullScreen');
            s.change_tab = g('swChangeTab');
            s.copy_paste = g('swCopyPaste');
            s.right_click = g('swRightClick');
            s.dev_tools = g('swDevTools');
            s.face_detect = g('wFaceDetect');
            s.multi_face = g('wMultiFace');
            s.auto_submit_fs = g('wAutoSubmitFS');
            s.tab_infrac = gi('wTabInfrac') || 3;
            s.auto_submit_tab = g('wAutoSubmitTab');
            s.time_limit_per_q = g('swTimerPerQ');
            s.auto_submit = g('swAutoSubmit');
            s.warn_time = g('swWarnTime');
            s.save_auto = g('swSaveAuto');
            s.snap_freq = gi('wSnapFreq') || 30;
            s.max_infraction = gi('wMaxInfrac') || 5;
        }
    }

    _validateStep(step) {
        if (step === 1) {
            const t = document.querySelector('input[name="wiz_type"]:checked')?.value;
            const ti = document.getElementById('wTitre')?.value?.trim();
            const du = document.getElementById('wDuree')?.value;
            if (!t) { this._toast('Sélectionnez un type d\'examen', 'error'); return false; }
            if (!ti) { this._toast('Le titre est obligatoire', 'error'); return false; }
            if (!du || parseInt(du) < 1) { this._toast('Durée invalide', 'error'); return false; }
        }
        return true;
    }

    // ══════════════════════════════════════════════════════════
    //  SAVE EXAM (CREATE / UPDATE)
    // ══════════════════════════════════════════════════════════
    async saveExam(publish = false) {
        this._captureStep(this._wiz.step); // capture current state first before it's lost

        const d = this._wiz.data;
        if (!d.titre) { this._toast('Titre obligatoire — retournez à l\'étape 1', 'error'); return; }
        if (!this._wiz.questions.length) { if (!confirm('Aucune question. Sauvegarder quand même ?')) return; }

        const saveBtn = document.getElementById('wizPublishBtn');
        const draftBtn = document.getElementById('wizSaveDraftBtn');
        if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<div class="ex-spinner ex-spinner-white"></div> Sauvegarde…'; }
        if (draftBtn) draftBtn.disabled = true;

        const api = this._getApi();
        const adminId = this._getAdminId();

        // Build security jsonb
        // We store security config in the description field as a JSON marker (workaround)
        const secJson = JSON.stringify(this._wiz.security);
        let finalDesc = (d.description || '').replace(/\s*<!--SEC_CFG:.*?-->\s*/g, '');
        finalDesc = (finalDesc + '\n\n<!--SEC_CFG:' + secJson + '-->').trim();

        const examPayload = {
            titre: d.titre,
            description: finalDesc || null,
            type_examen: d.type_examen || 'test',
            matiere_id: d.matiere_id ? parseInt(d.matiere_id) : null,
            chapitre_id: null,
            cours_id: null,
            niveau_id: d.niveau_id || null,
            serie_id: d.serie_id || null,
            sous_systeme_id: d.sous_systeme_id || null,
            duree_minutes: d.duree_minutes || 60,
            note_totale: d.note_totale || 20,
            note_passage: d.note_passage || 10,
            nombre_questions: this._wiz.questions.length,
            questions_aleatoires: d.questions_aleatoires || false,
            choix_aleatoires: d.choix_aleatoires || false,
            date_debut: d.date_debut || null,
            date_fin: d.date_fin || null,
            nombre_tentatives_max: d.nombre_tentatives_max || 1,
            delai_entre_tentatives: d.delai_entre_tentatives || 0,
            afficher_correction: d.afficher_correction !== false,
            afficher_note: d.afficher_note !== false,
            afficher_corrige_apres: d.afficher_corrige_apres !== false,
            est_publie: publish,
            est_actif: true,
            createur_id: adminId || null,
            updated_at: new Date().toISOString(),
        };

        try {
            let examId = this._editId;

            if (examId) {
                // UPDATE
                const { error } = await api.from('examens').update(examPayload).eq('id', examId);
                if (error) throw error;
                // Delete existing questions & choices (re-insert)
                const { data: oldQs } = await api.from('questions_examen').select('id').eq('examen_id', examId);
                if (oldQs?.length) {
                    const oldIds = oldQs.map(q => q.id);
                    await api.from('choix_reponses').delete().in('question_id', oldIds);
                    await api.from('questions_examen').delete().in('id', oldIds);
                }
            } else {
                // INSERT
                examPayload.created_at = new Date().toISOString();
                const { data: newEx, error } = await api.from('examens').insert([examPayload]).select().single();
                if (error) throw error;
                examId = newEx.id;
            }

            // Save questions
            await this._saveQuestions(api, examId);

            this._toast(publish ? '✅ Examen publié avec succès !' : '💾 Brouillon sauvegardé !', 'success');
            this._wiz.changed = false;
            this.closeWizard();
            await this._loadCatalog();

        } catch (err) {
            console.error('Save exam error:', err);
            this._toast('❌ Erreur: ' + err.message, 'error');
            if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '📢 Sauver & Publier'; }
            if (draftBtn) { draftBtn.disabled = false; }
        }
    }

    async _saveQuestions(api, examId) {
        const qs = this._wiz.questions;
        for (let i = 0; i < qs.length; i++) {
            const q = qs[i];
            const isComplex = q.type_question === 'situation' || q.type_question === 'calcul' ||
                q.type_question === 'schema_annote';

            // For situation/calcul: store sub_questions in explication as JSON
            // For texte_long: store criteres in explication
            let explJson = q.explication || '';
            if (q.type_question === 'situation' || q.type_question === 'calcul') {
                explJson = JSON.stringify({
                    explication: q.explication || '',
                    sub_questions: q.sub_questions || [],
                    donnees: q.donnees || '',
                    correction_situation: q.correction_situation || ''
                });
            } else if (q.type_question === 'texte_long') {
                explJson = JSON.stringify({ explication: q.explication || '', criteres: q.criteres || '' });
            } else if (q.type_question === 'texte_court') {
                explJson = JSON.stringify({ explication: q.explication || '', reponse_ref: q.reponse_ref || '' });
            }

            const qPayload = {
                examen_id: examId,
                question_texte: q.type_question === 'situation' || q.type_question === 'calcul'
                    ? (q.question_texte || '') + (q.donnees ? '\n\n---DONNÉES---\n' + q.donnees : '')
                    : (q.question_texte || ''),
                type_question: (q.type_question === 'situation' || q.type_question === 'calcul' || q.type_question === 'schema_annote')
                    ? 'texte_long' : q.type_question,
                points: q.type_question === 'situation' || q.type_question === 'calcul'
                    ? (q.sub_questions || []).reduce((s, sq) => s + parseFloat(sq.pts || 0), 0)
                    : parseFloat(q.points || 1),
                ordre: i + 1,
                image_url: q.image_url || null,
                video_url: q.video_url || null,
                explication: explJson || null,
            };

            const { data: savedQ, error: qErr } = await api.from('questions_examen')
                .insert([qPayload]).select().single();
            if (qErr) throw qErr;

            // Save choices
            if ((q.type_question === 'qcm_unique' || q.type_question === 'qcm_multiple') && q.choix?.length) {
                const choixPayload = q.choix
                    .filter(c => c.texte_choix?.trim())
                    .map((c, ci) => ({
                        question_id: savedQ.id,
                        texte_choix: c.texte_choix.trim(),
                        est_correct: c.est_correct || false,
                        ordre: ci + 1
                    }));
                if (choixPayload.length) {
                    const { error: cErr } = await api.from('choix_reponses').insert(choixPayload);
                    if (cErr) throw cErr;
                }
            }
        }
    }

    // ══════════════════════════════
    //  EDIT EXAM
    // ══════════════════════════════
    async editExamen(id) {
        const api = this._getApi();
        const [{ data: ex }, { data: qs }] = await Promise.all([
            api.from('examens').select('*').eq('id', id).single(),
            api.from('questions_examen').select('*,choix:choix_reponses(*)').eq('examen_id', id).order('ordre'),
        ]);
        if (!ex) { this._toast('Examen introuvable', 'error'); return; }

        // Parse questions
        const questions = (qs || []).map(q => {
            let sub_questions = [], donnees = '', criteres = '', reponse_ref = '', explication = '', correction_situation = '';
            try {
                const parsed = JSON.parse(q.explication || '{}');
                if (typeof parsed === 'object') {
                    explication = parsed.explication || '';
                    sub_questions = parsed.sub_questions || [];
                    donnees = parsed.donnees || '';
                    criteres = parsed.criteres || '';
                    reponse_ref = parsed.reponse_ref || '';
                    correction_situation = parsed.correction_situation || '';
                }
            } catch (e) { explication = q.explication || ''; }

            // Detect if it was a situation (sub_questions present)
            const type = sub_questions.length > 0 ? 'situation' : q.type_question;

            return {
                _uid: this._genUid(), _isNew: false, _dbId: q.id,
                type_question: type,
                question_texte: q.question_texte?.split('\n\n---DONNÉES---\n')[0] || '',
                donnees: donnees || (q.question_texte?.split('\n\n---DONNÉES---\n')[1] || ''),
                points: q.points,
                ordre: q.ordre,
                image_url: q.image_url || '',
                video_url: q.video_url || '',
                explication,
                criteres, reponse_ref, correction_situation,
                choix: (q.choix || []).sort((a, b) => a.ordre - b.ordre),
                sub_questions,
                _vf: null
            };
        });

        let secCfg = {};
        if (ex.description) {
            const match = ex.description.match(/<!--SEC_CFG:(.*?)-->/);
            if (match) {
                try { secCfg = JSON.parse(match[1]); } catch(e){}
                ex.description = ex.description.replace(/\s*<!--SEC_CFG:.*?-->\s*/g, '').trim();
            }
        }

        this.openWizard({ ...ex, id, _questions: questions, _security: secCfg });
    }

    // ══════════════════════════════
    //  TOGGLE PUBLISH
    // ══════════════════════════════
    async togglePublish(id, newState) {
        const { error } = await this._getApi().from('examens').update({
            est_publie: newState, updated_at: new Date().toISOString()
        }).eq('id', id);
        if (error) { this._toast('Erreur: ' + error.message, 'error'); return; }
        this._toast(newState ? '📢 Examen publié !' : '📤 Examen dépublié', 'success');
        await this._loadCatalog();
    }

    // ══════════════════════════════
    //  DELETE
    // ══════════════════════════════
    async deleteExamen(id, titre) {
        if (!confirm(`Supprimer "${titre}" ?\n\nToutes les questions, passages et réponses élèves seront supprimés.`)) return;
        const api = this._getApi();
        const { data: qs } = await api.from('questions_examen').select('id').eq('examen_id', id);
        if (qs?.length) {
            await api.from('choix_reponses').delete().in('question_id', qs.map(q => q.id));
            await api.from('questions_examen').delete().in('id', qs.map(q => q.id));
        }
        await api.from('reponses_eleve').delete().in('passage_id',
            ((await api.from('passages_examen').select('id').eq('examen_id', id)).data || []).map(p => p.id));
        await api.from('passages_examen').delete().eq('examen_id', id);
        const { error } = await api.from('examens').delete().eq('id', id);
        if (error) { this._toast('Erreur: ' + error.message, 'error'); return; }
        this._toast('✅ Examen supprimé', 'success');
        await this._loadCatalog();
    }

    // ══════════════════════════════
    //  PREVIEW
    // ══════════════════════════════
    async previewExamen(id) {
        const api = this._getApi();
        const [{ data: ex }, { data: qs }] = await Promise.all([
            api.from('examens').select('*,matiere:matieres(nom),niveau:niveaux_scolaires(nom_court),serie:series_specialites(nom_court)').eq('id', id).single(),
            api.from('questions_examen').select('*,choix:choix_reponses(*)').eq('examen_id', id).order('ordre'),
        ]);
        if (!ex) { this._toast('Examen introuvable', 'error'); return; }
        const cfg = TYPE_CFG[ex.type_examen] || TYPE_CFG.test;
        const qHtml = (qs || []).map((q, i) => {
            const choices = (q.choix || []).sort((a, b) => a.ordre - b.ordre);
            return `<div style="margin-bottom:1.25rem;padding:1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:.75rem">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem">
          <span style="font-size:.7rem;font-weight:700;color:#6366f1">Q${i + 1}</span>
          <span style="font-size:.65rem;font-weight:600;color:#94a3b8">${q.type_question}</span>
          <span style="font-size:.65rem;font-weight:700;color:#d97706;margin-left:auto">${q.points || 1} pt${q.points !== 1 ? 's' : ''}</span>
        </div>
        <div style="font-weight:600;font-size:.88rem;color:#0f172a;margin-bottom:.5rem">${escHtml(q.question_texte || '')}</div>
        ${q.image_url ? `<img src="${q.image_url}" style="max-width:100%;max-height:160px;border-radius:.5rem;margin-bottom:.5rem" />` : ''}
        ${choices.length ? `<div style="display:flex;flex-direction:column;gap:.3rem">${choices.map((c, ci) => `
          <div style="display:flex;align-items:center;gap:.5rem;padding:.38rem .65rem;border-radius:.45rem;
            background:${c.est_correct ? 'rgba(16,185,129,.1)' : 'transparent'};
            border:1px solid ${c.est_correct ? '#bbf7d0' : '#e2e8f0'}">
            <span style="font-size:.7rem;font-weight:700;color:${c.est_correct ? '#16a34a' : '#94a3b8'}">${LETTERS[ci]}</span>
            <span style="font-size:.82rem">${escHtml(c.texte_choix)}</span>
            ${c.est_correct ? '<span style="margin-left:auto;font-size:.75rem">✅</span>' : ''}
          </div>`).join('')}</div>` :
                    `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:.45rem;height:48px;display:flex;align-items:center;padding:0 .875rem;color:#94a3b8;font-size:.82rem">Réponse ouverte…</div>`}
      </div>`;
        }).join('');

        let modal = document.getElementById('exPreviewModal');
        if (!modal) {
            modal = document.createElement('div'); modal.id = 'exPreviewModal'; modal.className = 'ex-modal-bg';
            document.body.appendChild(modal);
        }
        modal.innerHTML = `<div class="ex-modal" style="max-width:700px">
      <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;background:${cfg.bg}">
        <div><div style="font-weight:800;font-size:1rem;color:#0f172a">${cfg.icon} ${escHtml(ex.titre)}</div>
          <div style="font-size:.75rem;color:#64748b;margin-top:.2rem">${ex.matiere?.nom || ''} · ${ex.niveau?.nom_court || ''} · ${formatDuration(ex.duree_minutes || 0)} · /${ex.note_totale || 20}</div></div>
        <button class="btn-ex-icon" onclick="document.getElementById('exPreviewModal').classList.remove('show')">✕</button>
      </div>
      <div style="padding:1.25rem;max-height:65vh;overflow-y:auto">${qHtml || '<p style="text-align:center;color:#94a3b8;padding:2rem">Aucune question</p>'}</div>
    </div>`;
        modal.classList.add('show');
    }

    // ══════════════════════════════
    //  HELPERS
    // ══════════════════════════════
    _toggleHtml(id, name, desc, checked = false) {
        return `<div class="toggle-row ${checked ? 'on' : ''}" id="trow-${id}">
      <div class="toggle-info">
        <div class="toggle-name">${name}</div>
        <div class="toggle-desc">${desc}</div>
      </div>
      <label class="toggle-sw">
        <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} onchange="this.closest('.toggle-row').classList.toggle('on',this.checked);window.ExMgr._updateSecMeter?.()"/>
        <span class="toggle-slider"></span>
      </label>
    </div>`;
    }

    _getApi() {
        // Compatible avec api.client de l'existant ET window.supabaseClient
        return window.supabaseClient || window.api?.client;
    }

    _getAdminId() {
        return window.AppState?.currentUser?.id || null;
    }

    _bindWizStep(step) {
        if (step === 2) setTimeout(() => this._updateSecMeter(), 100);
    }

    _toast(msg, type = 'info') {
        const area = document.getElementById('exToastArea');
        if (!area) return;
        const el = document.createElement('div');
        el.className = `ex-toast ${type}`;
        el.textContent = msg;
        area.appendChild(el);
        setTimeout(() => {
            el.style.opacity = '0'; el.style.transform = 'translateX(20px)';
            setTimeout(() => el.remove(), 300);
        }, 3000);
    }
}

// ── Singleton export ─────────────────────────────────────────
export const examensView = new ExamensView();
window.ExMgr = examensView;
window.examensView = examensView;