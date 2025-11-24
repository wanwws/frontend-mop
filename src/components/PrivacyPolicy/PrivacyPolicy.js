import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message, Modal } from "antd";
import { useTranslation } from "react-i18next";
import axios from "axios";
import i18n from "../../i18n";
import PrivacyPolicyEN from "./PrivacyPolicyEN";
import PrivacyPolicyTH from "./PrivacyPolicyTH";
import BASE_URL from "../../config/apiConfig";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { t } = useTranslation();
  const language = i18n.language;

  useEffect(() => {
    document.title =
      language === "th" ? "นโยบายความเป็นส่วนตัว" : "Privacy Policy";
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const getToken = () => localStorage.getItem("token");

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

  const checkTokenValidity = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}/staff/auth/check/token`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn("Token expired or invalid:", error.response.data.message);
        clearSession();
        setIsLoggedIn(false);
        message.warning("Session expired. Please login again.");
      }
    }
  };

  useEffect(() => {
    checkTokenValidity();
    setIsLoggedIn(!!getToken());
  }, []);

  const handleLogoutClick = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");

    if (!token) {
      message.warning("No token found. Please login first.");
      setIsLoading(false);
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
      setIsLoggedIn(false);
      message.success("Logout successful!");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      message.error(
        error.response?.data?.message || "Logout failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (e) => {
    const selectedLang = e.target.value;
    i18n.changeLanguage(selectedLang);
  };

  const footerRef = useRef(null);
  const scrollToFooter = () => {
    if (footerRef.current) {
      footerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div>
      <div style={{ background: "#AADDD9", height: "120px" }}>
        <div className="menu-toggle" id="show-menu-bar">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div
          className={`top-nav home ${isScrolled ? "scrolled" : ""}`}
          id="menu-bar"
        >
          <div className="close-menu" id="close-menu-bar">
            <span></span>
            <span></span>
          </div>
          <div className="logo-box">
            <img className="moph-logo" src="/images/moph-logo.png" alt="" />
            <img className="hitap-logo" src="/images/hitap-logo.png" alt="" />
          </div>
          <div className="menu-box">
            <a
              href="/"
              className="menu-item active"
              onClick={() => {
                navigate("/");
              }}
              style={{ fontSize: "20px" }}
            >
              {t("home")}
            </a>
            <a
              href="/"
              className="menu-item"
              onClick={(e) => {
                navigate("/");
                e.preventDefault();
              }}
              style={{ fontSize: "20px" }}
            >
              {t("Dashboard")}
            </a>

            <a
              href="/aboutus"
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                scrollToFooter();
              }}
              style={{ fontSize: "20px" }}
            >
              {t("AboutUs")}
            </a>
          </div>
          <div className="translate-box">
            {/* <button
              className="btn btn-theme-success btn-login"
              onClick={handleLogoutClick}
            >
              <img src="/images/icon/icon-account-white.png" alt="" />
              <span>{t("logout")}</span>
            </button> */}
            <select
              className="input-theme-select"
              onChange={handleLanguageChange}
              value={i18n.language}
            >
              <option value="en">EN</option>
              <option value="th">TH</option>
            </select>
          </div>
        </div>
      </div>
      <div className="dashboard-section">
        <div className="dashboard-container">
          <div className="dashboard-content-container">
            {i18n.language === "th" ? <PrivacyPolicyTH /> : <PrivacyPolicyEN />}
          </div>
        </div>
        {/* Footer */}
        <footer ref={footerRef}>
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
          <p className="footer">
            Copyright © by Ministry of Public Health 2025
          </p>
        </footer>
      </div>
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

export default PrivacyPolicy;
