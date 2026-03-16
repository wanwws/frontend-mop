import React, { useState } from "react";
import { Button, message, Modal } from "antd";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import MenuPage from "../Menu/MenuPage";
import BASE_URL from "../../config/apiConfig";
import AnnouncementBar from "../AnnouncementBar"; 

const UnlockAccount = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const isTH = i18n.language.toLowerCase().startsWith("th");

  // logout user ที่ค้างไว้
  const handleForceLogout = async () => {
    if (!email) {
      message.warning(isTH ? "กรุณากรอกอีเมลผู้ใช้" : "Please enter user email");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/staff/auth/logout/token/${email}`);
      message.success(isTH ? "ปลดล็อกบัญชีสำเร็จ" : "Account unlocked successfully!");
    } catch (err) {
      message.error(
        err.response?.data?.message ||
          (isTH ? "ไม่สามารถปลดล็อกบัญชีนี้ได้" : "Failed to unlock account")
      );
      console.error("Error:", err);
    } finally {
      setLoading(false);
      setIsConfirmModalOpen(false);
      setEmail("");
    }
  };

  // เปิด modal ยืนยัน
  const showConfirmModal = () => {
    if (!email) {
      message.warning(isTH ? "กรุณากรอกอีเมลผู้ใช้" : "Please enter user email");
      return;
    }
    setIsConfirmModalOpen(true);
  };

  return (
    <div className="main-bg">
      <AnnouncementBar />
      <style>{`
        .content-body {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 70vh;
          padding: 20px;
        }

        .unlock-box {
          background: #ffffff;
          border-radius: 16px;
          width: 580px;
          padding: 32px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.1);
          text-align: center;
          animation: fadeIn 0.4s ease;
        }

        .unlock-box h2 {
          color: #00796B;
          font-weight: 700;
          font-size: 24px;
          margin-bottom: 10px;
        }

        .unlock-box input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid #ccc;
          border-radius: 8px;
          font-size: 16px;
          margin-bottom: 20px;
          transition: 0.2s ease;
        }

        .unlock-box input:focus {
          border-color: #009688;
          box-shadow: 0 0 5px rgba(0,150,136,0.4);
          outline: none;
        }

        .unlock-box button {
          width: 100%;
          background-color: #00796B;
          border-color: #00796B;
          border-radius: 8px;
          height: 42px;
          font-size: 16px;
        }

        .unlock-box button:hover {
          background-color: #009688 !important;
          border-color: #009688 !important;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="main-container">
        <div className="bg-overlay">
          <img src="/images/bg-nav.png" alt="Background" />
        </div>

        <MenuPage handleLogoutClick={() => navigate("/")} />

        <div className="form-container">
          <div className="content-box">
            <div className="content-header">
              <div className="main-header">
                <div className="title" style={{ display: "flex", gap: 10 }}>
                  <img src="/images/icon/icon-record.png" alt="icon" />
                  <p style={{ margin: 0 }}>{t("UNLOCK ACCOUNT")}</p>
                </div>
              </div>
            </div>
            <div className="content-body">
              <div className="unlock-box">
                <p style={{ marginBottom: "8px", fontSize: "22px" }}>
                  {t("Enter the user's email to unlock account")}
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                />
                <Button
                  type="primary"
                  block
                  onClick={showConfirmModal}
                  style={{ marginBottom: "8px", fontSize: "20px" }}
                >
                  {t("Unlock Account")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal ยืนยันก่อนทำจริง */}
      <Modal
        open={isConfirmModalOpen}
        centered
        onCancel={() => setIsConfirmModalOpen(false)}
        footer={null}
        title={
          <span style={{ fontSize: 20, fontWeight: 600, color: "#00796B" }}>
            {t("Confirm Unlock Account")}
          </span>
        }
      >
        <p style={{ fontSize: "16px" }}>
          {t("Are you sure you want to unlock this account?")}
        </p>
        <div
          style={{
            background: "#f5f5f5",
            padding: "10px 14px",
            borderRadius: "6px",
            fontWeight: 500,
            color: "#333",
            marginBottom: "20px",
          }}
        >
          {email}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={() => setIsConfirmModalOpen(false)}>
            {t("Cancel")}
          </Button>
          <Button
            type="primary"
            onClick={handleForceLogout}
            loading={loading}
            style={{ backgroundColor: "#00796B", borderColor: "#00796B" }}
          >
            {t("Confirm")}
          </Button>
        </div>
      </Modal>

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

export default UnlockAccount;
