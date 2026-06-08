"use client";

import { stringifyJson } from "./adminData";

export function TextField({ label, value, onChange, type = "text" }) {
  return (
    <label>
      {label}
      <input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function TextArea({ label, value, onChange }) {
  return (
    <label>
      {label}
      <textarea value={value || ""} onChange={(event) => onChange(event.target.value)} rows={4} />
    </label>
  );
}

export function CheckField({ label, checked, onChange }) {
  return (
    <label className="admin-check">
      <input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

export function FileField({ label, onChange }) {
  return (
    <label className="admin-upload-field">
      <span>{label}</span>
      <span className="admin-upload-control">
        <span>Chọn tệp</span>
        <small>PNG, JPG, WEBP, GLB hoặc USDZ</small>
      </span>
      <input type="file" onChange={(event) => onChange(event.target.files?.[0])} />
    </label>
  );
}

export function JsonField({ label, name, selected, jsonDraft, setJsonDraft }) {
  return (
    <label>
      {label}
      <textarea
        value={jsonDraft[name] ?? stringifyJson(selected)}
        onChange={(event) => setJsonDraft((current) => ({ ...current, [name]: event.target.value }))}
        rows={5}
      />
    </label>
  );
}

export function StatusFields({ selected, setField, featuredLabel }) {
  return (
    <>
      <label>
        Status
        <select value={selected.status || "draft"} onChange={(event) => setField("status", event.target.value)}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </label>
      <TextField label="Sort order" type="number" value={selected.sortOrder} onChange={(value) => setField("sortOrder", value)} />
      {featuredLabel ? <CheckField label={featuredLabel} checked={selected.isFeatured} onChange={(value) => setField("isFeatured", value)} /> : null}
    </>
  );
}
