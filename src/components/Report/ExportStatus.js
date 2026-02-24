/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState } from "react";
import { message, Modal } from "antd";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import i18n from "../../i18n";
import "bootstrap/dist/css/bootstrap.min.css";
import BASE_URL from "../../config/apiConfig";
import MenuPage from "../Menu/MenuPage";
import { DownOutlined } from "@ant-design/icons";

const ExportStatus = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // ฟังก์ชันช่วยอ่าน Token
  const getToken = () => localStorage.getItem("token");

  // ฟังก์ชันช่วยลบข้อมูล session
  const clearSession = () => {
    [
      "token",
      "roleID",
      "username",
      "provinceCode",
      "districtCode",
      "hospitalCode",
    ].forEach((key) => {
      localStorage.removeItem(key);
    });
  };

  const handleLogoutClick = async () => {
    const token = getToken();
    if (!token) {
      message.warning("No token found. Please login first.");
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
      clearSession();
      message.success("Logout successful!");
      localStorage.clear();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      message.error(
        error.response?.data?.message || "Logout failed. Please try again."
      );
    }
  };

  const handleExportStatus = async () => {
    const token = getToken();

    if (!token) {
      message.error("No token found. Please login first.");
      return;
    }

    try {
      const response = await axios.post(
        `${BASE_URL}/report/hospital/status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const fileUrl = response?.data?.data;

      if (!fileUrl) {
        message.error("No file URL returned from server");
        return;
      }

      // Trigger download
      const link = document.createElement("a");
      link.href = fileUrl;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      link.remove();

      message.success("Export success!");
    } catch (error) {
      console.error("Export error:", error);
      message.error(
        error.response?.data?.message || "Export failed. Please try again."
      );
    }
  };

  return (
    <div className="main-bg">
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
                <div className="title">
                  <img src="/images/icon/icon-record.png" alt="Record" />
                  <p>{t("EXPORT STATUS")}</p>
                </div>
              </div>
              <div className="sub-header">
                <div className="filter-bar-report"></div>
              </div>
            </div>
            <div className="content-body">
              <h4
                style={{
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "flex-start",
                }}
              >
                {t("Export status report for internal use.")}
              </h4>
              <p
                style={{
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "flex-start",
                }}
              >
                {" "}
                {t(
                  "This feature allows System Admin/Staff to download the latest hospital status summary."
                )}
              </p>
              <button
                onClick={handleExportStatus}
                className="btn btn-primary"
                style={{
                  marginBottom: "20px",
                  backgroundColor: "#0D7664",
                  borderColor: "#0D7664",
                  display: "flex",
                  justifyContent: "flex-start",
                }}
              >
                {t("Export status")}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
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
        title={
          <span style={{ fontSize: "20px", fontWeight: "600" }}>
            {t("Contact Information")}
          </span>
        }
        centered
        styles={{
          body: {
            background: "#BCE1DD",
            padding: "20px",
            borderRadius: "10px",
          },
        }}
      >
        <div>
          <p style={{ fontSize: "16px" }}>
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
            <br />
            {t("Tel: +660-2590-1542 | Fax: +660-2590-1760")}
            <br />
            Email: <a href="mailto:env.moph2@gmail.com">env.moph2@gmail.com</a>
          </p>
          <hr />
          <p style={{ fontSize: "16px" }}>
            <b>
              {t(
                "Environmental Economics Unit, Health Intervention and Technology Assessment Program Foundation (HITAP)"
              )}
            </b>
            <br />
            {t(
              "Head Office: 88/22 Moo 4, Building 6, 6th Floor, Ministry of Public Health,Tiwanon Road, Talat Khwan Subdistrict, Mueang District, Nonthaburi Province, 11000, Thailand"
            )}
            <br />
            {t("Tel: +660-2590-4369")}
            <br />
            {t("Fax: +660-2590-4369")}
            <br />
            Email: <a href="mailto:envecon@hitap.net">envecon@hitap.net</a>
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ExportStatus;
