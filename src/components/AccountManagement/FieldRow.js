import React from "react";

const FieldRow = React.memo(({ f, editable, form, setForm, staffInfo, isTH, S }) => {
  const handleChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [f.key]: value }));
  };

  return (
    <div className="field-row">
      <label>{f.label}</label>
      {editable ? (
        <input
          value={form[f.key] ?? ""}
          onChange={handleChange}
          placeholder={isTH ? "กรอกข้อมูล" : "Update value"}
          style={S.inputEditable}
        />
      ) : (
        <input readOnly value={staffInfo?.[f.key] ?? ""} style={S.input} />
      )}
    </div>
  );
});

export default FieldRow;
