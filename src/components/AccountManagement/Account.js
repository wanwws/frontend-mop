/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useMemo, useState } from "react";
import { Button, Modal, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import BASE_URL from "../../config/apiConfig";
import MenuPage from "../Menu/MenuPage";
import FieldRow from "./FieldRow";

const Account = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [staffInfo, setStaffInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  // ฟอร์มสำหรับ field ที่แก้ไขได้เท่านั้น
  const [form, setForm] = useState({
    contact: "",
    department: "",
    position: "",
    nameTH: "",
    lastnameTH: "",
    nameEN: "",
    lastnameEN: "",
  });

  const [hasChanges, setHasChanges] = useState(false);

  const getToken = () => localStorage.getItem("token");
  const isTH = (i18n.language || "").toLowerCase().startsWith("th");

  // ===== Field order & labels =====
  const ORDER_TH = [
    "username",
    "roleDescription",
    "nameTH",
    "accessLevelDescription",
    "lastnameTH",
    "agencyCode",
    "contact",
    "agencyName",
    "department",
    "zoneHealthCode",
    "position",
    "provinceName",
    "districtName",
    "subDistrictName",
  ];

  const ORDER_EN = [
    "username",
    "roleDescription",
    "nameEN",
    "accessLevelDescription",
    "lastnameEN",
    "agencyCode",
    "contact",
    "agencyName",
    "department",
    "zoneHealthCode",
    "position",
    "provinceName",
    "districtName",
    "subDistrictName",
  ];

  const LABELS_TH = {
    username: "อีเมล",
    roleDescription: "บทบาทหน้าที่",
    accessLevelDescription: "ระดับสิทธิ์การเข้าถึง",
    agencyCode: "รหัสหน่วยงาน",
    agencyName: "ชื่อหน่วย",
    nameTH: "ชื่อ",
    lastnameTH: "นามสกุล",
    contact: "ข้อมูลติดต่อ",
    department: "หน่วยงาน / แผนก",
    position: "ตำแหน่ง",
    zoneHealthCode: "เขตสุขภาพ",
    provinceName: "จังหวัด",
    districtName: "อำเภอ",
    subDistrictName: "ตำบล",
  };

  const LABELS_EN = {
    username: "Email",
    roleDescription: "Role",
    accessLevelDescription: "Access Level",
    agencyCode: "Agency Code",
    agencyName: "Agency Name",
    nameEN: "First Name",
    lastnameEN: "Last Name",
    contact: "Contact",
    department: "Department",
    position: "Position",
    zoneHealthCode: "Zone Health",
    provinceName: "Province",
    districtName: "District",
    subDistrictName: "Subdistrict",
  };

  const ORDER = isTH ? ORDER_TH : ORDER_EN;
  const LABELS = isTH ? LABELS_TH : LABELS_EN;

  // ฟิลด์ที่อนุญาตให้แก้ไขได้
  const EDITABLE_KEYS = [
    "contact",
    "department",
    "position",
    "nameTH",
    "lastnameTH",
    "nameEN",
    "lastnameEN",
  ];

  // ===== UI Styles (สำหรับ input) =====
  const S = {
    input: {
      width: "100%",
      borderRadius: 10,
      padding: "10px 14px",
      border: "1px solid rgba(16,136,101,0.2)",
      background: "#fff",
    },
    inputEditable: {
      width: "100%",
      borderRadius: 10,
      padding: "10px 14px",
      border: "1px solid rgba(16,136,101,0.35)",
      background: "#fff",
      boxShadow: "0 2px 8px rgba(16,136,101,0.06) inset",
    },
    actions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 12,
    },
  };

  // ===== Fetch Staff Info =====
  useEffect(() => {
    const fetchStaffInfo = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/staff/information`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = res?.data?.data || {};
        setStaffInfo(data);
        setForm({
          contact: data?.contact ?? "",
          department: data?.department ?? "",
          position: data?.position ?? "",
          nameTH: data?.nameTH ?? "",
          lastnameTH: data?.lastnameTH ?? "",
          nameEN: data?.nameEN ?? "",
          lastnameEN: data?.lastnameEN ?? "",
        });
      } catch (err) {
        console.error("Error fetching staff info:", err);
        message.error(
          isTH ? "ดึงข้อมูลบัญชีไม่สำเร็จ" : "Failed to load staff information."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchStaffInfo();
  }, []);

  //ตรวจจับการเปลี่ยนค่าแบบไม่เด้ง
  useEffect(() => {
    if (!staffInfo) return;
    const changed =
      (form.contact ?? "") !== (staffInfo?.contact ?? "") ||
      (form.department ?? "") !== (staffInfo?.department ?? "") ||
      (form.position ?? "") !== (staffInfo?.position ?? "") ||
      (form.nameTH ?? "") !== (staffInfo?.nameTH ?? "") ||
      (form.lastnameTH ?? "") !== (staffInfo?.lastnameTH ?? "") ||
      (form.nameEN ?? "") !== (staffInfo?.nameEN ?? "") ||
      (form.lastnameEN ?? "") !== (staffInfo?.lastnameEN ?? "");
    setHasChanges(changed);
  }, [form, staffInfo]);

  // ===== Update เฉพาะ 3 ฟิลด์ =====
  const handleSave = async () => {
    if (!hasChanges && !isSynced) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${BASE_URL}/staff/information`,
        { ...form },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      message.success(isTH ? "อัปเดตข้อมูลสำเร็จ" : "Update success");
    } catch (err) {
      if (err.response?.status === 401) {
        try {
          const oldToken = localStorage.getItem("token");
          const refreshRes = await axios.post(
            `${BASE_URL}/staff/auth/refresh/token`,
            {},
            { headers: { Authorization: `Bearer ${oldToken}` } }
          );
          const newToken = refreshRes.data?.data?.token;
          if (newToken) {
            localStorage.setItem("token", newToken);
            // update userInfo ด้วย token ใหม่
            const oldUserInfo = JSON.parse(
              localStorage.getItem("userInfo") || "{}"
            );
            const newUserInfo = { ...oldUserInfo, token: newToken };
            localStorage.setItem("userInfo", JSON.stringify(newUserInfo));
            // retry
            await axios.put(
              `${BASE_URL}/staff/information`,
              { ...form },
              {
                headers: { Authorization: `Bearer ${newToken}` },
              }
            );
            message.success(isTH ? "อัปเดตข้อมูลสำเร็จ" : "Update success");
          }
        } catch {
          message.error(
            isTH
              ? "Token หมดอายุ กรุณาเข้าสู่ระบบใหม่"
              : "Token expired. Please login again."
          );
          localStorage.clear();
          navigate("/");
        }
      } else {
        message.error(
          err.response?.data?.message ||
            (isTH ? "อัปเดตข้อมูลไม่สำเร็จ" : "Update failed")
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // ===== Logout =====
  const handleLogoutClick = async () => {
    const token = getToken();
    if (!token) {
      message.warning(
        isTH
          ? "ไม่พบ token กรุณาเข้าสู่ระบบก่อน"
          : "No token found. Please login first."
      );
      return;
    }
    try {
      await axios.post(
        `${BASE_URL}/staff/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      localStorage.clear();
      message.success(isTH ? "ออกจากระบบสำเร็จ" : "Logout successful!");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      message.error(
        error.response?.data?.message ||
          (isTH ? "ออกจากระบบไม่สำเร็จ" : "Logout failed.")
      );
    }
  };

  // ===== เตรียม items =====
  const items = useMemo(
    () => ORDER.map((key) => ({ key, label: LABELS[key] || key })),
    [ORDER, LABELS]
  );

  const leftItems = useMemo(() => items.filter((_, i) => i % 2 === 0), [items]);
  const rightItems = useMemo(
    () => items.filter((_, i) => i % 2 === 1),
    [items]
  );

  // ===== Sync ข้อมูลล่าสุดจาก CORE =====
  const handleSyncLatest = async () => {
    // 🟡 ถ้าไม่มี agencyCode ไม่ต้อง sync
    if (!staffInfo?.agencyCode) {
      message.warning(
        isTH
          ? "ไม่พบรหัสหน่วยงาน ไม่สามารถซิงค์ข้อมูลได้"
          : "No agency code found. Cannot sync data."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put(
        `${BASE_URL}/staff/auto/information`,
        {
          email: staffInfo?.username || "",
          roleID: staffInfo?.roleID ?? "",
          accessLevelID: staffInfo?.accessLevelID ?? "",
          isActive: staffInfo?.isActive ?? 1,
        },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      const latest = res?.data?.data || {};

      // ถ้ามี token ใหม่
      if (latest?.token) {
        localStorage.setItem("token", latest.token);
        const oldUserInfo = JSON.parse(
          localStorage.getItem("userInfo") || "{}"
        );
        const newUserInfo = { ...oldUserInfo, ...latest, token: latest.token };
        localStorage.setItem("userInfo", JSON.stringify(newUserInfo));
      }

      // update form
      const updatedForm = {
        contact: latest?.contact ?? "",
        department: latest?.department ?? "",
        position: latest?.position ?? "",
      };
      setForm(updatedForm);
      setStaffInfo((prev) => ({ ...prev, ...latest }));

      // Save Auto หลัง Sync
      const token = localStorage.getItem("token");
      await axios.put(
        `${BASE_URL}/staff/information`,
        { ...updatedForm },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      message.success(
        isTH ? "ซิงค์และบันทึกข้อมูลสำเร็จ" : "Synced and saved successfully."
      );
    } catch (err) {
      console.error("Sync Data error:", err);
      message.error(
        err.response?.data?.message ||
          (isTH ? "ซิงค์ข้อมูลไม่สำเร็จ" : "Sync failed.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-bg">
      <style>{`
  .account-two-col{
    display:grid;
    grid-template-columns: 1fr;
    gap:24px;
  }
  @media (min-width: 1200px){
    .account-two-col{
      grid-template-columns: 1fr 1fr;
      column-gap: 72px;   
      row-gap: 20px;     
    }
  }
  .field-row{
    display:grid;
    grid-template-columns: 190px minmax(0,1fr); 
    align-items:center;
    gap:16px;          
    margin-bottom:38px; 
  }
  .field-row label{
    margin:0;
    font-weight:600;
    text-align:right;
    white-space:nowrap;
    padding-right:12px;
  }
`}</style>

      <div className="menu-toggle" id="show-menu-bar">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className="main-container">
        <div className="bg-overlay">
          <img src="/images/bg-nav.png" alt="Background" />
        </div>

        <MenuPage handleLogoutClick={handleLogoutClick} />

        <div className="form-container">
          <div className="content-box">
            <div className="content-header">
              <div className="main-header">
                <div className="title" style={{ display: "flex", gap: 10 }}>
                  <img src="/images/icon/icon-record.png" alt="Record" />
                  <p style={{ margin: 0 }}>{t("ACCOUNT INFORMATION")}</p>
                </div>
              </div>
            </div>

            <div className="content-body">
              <p
                className="title"
                style={{ marginBottom: 28, fontSize: "22px" }}
              >
                {/* {isTH ? "ข้อมูลบัญชีผู้ใช้" : "Account Information"} */}
              </p>

              {loading ? (
                <p>{isTH ? "กำลังโหลด…" : "Loading…"}</p>
              ) : (
                <>
                  <div className="account-two-col">
                    <div>
                      {leftItems.map((f) => (
                        <FieldRow
                          key={f.key} // key จะไม่เปลี่ยน
                          f={f}
                          editable={EDITABLE_KEYS.includes(f.key)}
                          form={form}
                          setForm={setForm}
                          staffInfo={staffInfo}
                          isTH={isTH}
                          S={S}
                        />
                      ))}
                    </div>
                    <div>
                      {rightItems.map((f) => (
                        <FieldRow
                          key={f.key} // key จะไม่เปลี่ยน
                          f={f}
                          editable={EDITABLE_KEYS.includes(f.key)}
                          form={form}
                          setForm={setForm}
                          staffInfo={staffInfo}
                          isTH={isTH}
                          S={S}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={S.actions}>
                    {/*แสดงปุ่ม Sync Data เฉพาะตอนมี agencyCode */}
                    {staffInfo?.agencyCode && (
                      <Button
                        onClick={handleSyncLatest}
                        disabled={loading || saving}
                        type="default"
                      >
                        {isTH ? "ซิงค์ข้อมูล" : "Sync Data"}
                      </Button>
                    )}

                    <Button
                      loading={saving}
                      type="primary"
                      onClick={async () => {
                        await handleSave();
                        setIsSynced(false);
                      }}
                    >
                      {isTH ? "บันทึกข้อมูล" : "Save"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer>
        <div className="contact">
          <p
            onClick={() => window.open("/privacy-policy", "_blank")}
            style={{ cursor: "pointer" }}
          >
            {t("Privacy Policy")}
          </p>
          <p
            onClick={() => window.open("/terms-of-use", "_blank")}
            style={{ cursor: "pointer" }}
          >
            {t("Terms of use")}
          </p>
          <p
            onClick={() => setIsContactModalOpen(true)}
            style={{ cursor: "pointer" }}
          >
            {t("Contact Information")}
          </p>
        </div>
        <p className="footer">Copyright © by Ministry of Public Health 2025</p>
      </footer>

      <Modal
        open={isContactModalOpen}
        onCancel={() => setIsContactModalOpen(false)}
        footer={null}
        centered
        title={
          <span style={{ fontSize: 20, fontWeight: 600 }}>
            {t("Contact Information")}
          </span>
        }
        styles={{
          body: { background: "#BCE1DD", padding: 20, borderRadius: 10 },
        }}
      >
        <p style={{ fontSize: 16 }}>
          <b>
            {t(
              "Service Support System Development Group, Health Administration Division"
            )}
          </b>
          <br />
          {t(
            "88/22 Moo 4 Building 3, 5th Floor, Office of the Permanent Secretary of Ministry of Public Health, Tiwanon Road, Talat Khwan, Mueang Nonthaburi, Nonthaburi 11000"
          )}
          <br />
          {t("Tel: +660-2590-1635 | Fax: +660-2590-1641")}
          <br />
          Email: <a href="mailto:env.moph2@gmail.com">env.moph2@gmail.com</a>
        </p>
      </Modal>
    </div>
  );
};

export default Account;
