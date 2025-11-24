import React, { useState, useEffect } from "react";
import { Button } from "antd";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";

const MenuPage = ({ handleLogoutClick }) => {
  const { t } = useTranslation();
  const location = useLocation();

  const roleID = Number(localStorage.getItem("roleID") || 0);

  const canSeeStaffRequests = [1, 2, 3].includes(roleID);
  const canSeeSessionManagement = [1, 2].includes(roleID);
  const canSeeUnlockAccount = [1, 2].includes(roleID);
  const canSeeManageData = [1, 2].includes(roleID);

  // ✅ path ที่อยู่ใต้ Account Management
  const underAccountPaths = [
    "/unlock-account",
    "/session-management",
    "/account-management",
    "/staff-requests",
    "/manage-data", 
    "/change-password",
  ];
  const underEmissionPaths = [
    "/emissions-record",
    "/add-record",
    "/add-scope",
    "/export-data",
  ];

  // ✅ เช็คว่าอยู่ path ไหน ถ้าใช่ → กางเมนูออกอัตโนมัติ
  const isInAccountPath = underAccountPaths.some((p) =>
    location.pathname.startsWith(p)
  );

  const isInEmissionPath = underEmissionPaths.some((p) =>
    location.pathname.startsWith(p)
  );

  const emissionPaths = ["/emissions-record", "/add-record", "/add-scope"];
  const isEmissionActive = emissionPaths.some((p) =>
    location.pathname.startsWith(p)
  );

  const [isAccountOpen, setIsAccountOpen] = useState(isInAccountPath);
  const [isEmissionOpen, setIsEmissionOpen] = useState(isInEmissionPath);

  // เวลาเปลี่ยนหน้า → sync state ใหม่
  useEffect(() => {
    if (isInAccountPath) {
      setIsAccountOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isInAccountPath) setIsAccountOpen(true);
    if (isInEmissionPath) setIsEmissionOpen(true);
  }, [location.pathname]);

  return (
    <div className="menu-bar">
      <div className="logo-box">
        <img src="/images/nav-logo.png" alt="Logo" />
      </div>

      <ul className="menu-lists">
        <li>
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <img className="li-icon" src="/images/icon/home.png" alt="home" />
            {t("Home")}
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/dashboard-staff"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <img
              className="li-icon"
              src="/images/icon/data-analysis.png"
              alt="dashboard"
            />
            {t("Dashboard")}
          </NavLink>
        </li>

        <li className={`has-submenu ${isEmissionOpen ? "open" : ""}`}>
          <a
            onClick={() => setIsEmissionOpen(!isEmissionOpen)}
            style={{
              fontSize: "20px",
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <img
              className="li-icon"
              src="/images/icon/factory.png"
              alt="emissions"
            />
            {t("Emission")}
            <span
              style={{
                marginLeft: "auto",
                opacity: 0.7,
                transition: "transform 0.2s ease",
                transform: isEmissionOpen ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              ▸
            </span>
          </a>

          {isEmissionOpen && (
            <ul className="submenu">
              <li>
                <NavLink
                  to="/emissions-record"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  {t("Emissions Assessment")}
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/export-data"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  {t("Export data")}
                </NavLink>
              </li>
            </ul>
          )}
        </li>

        {/* Account Management */}
        <li className={`has-submenu ${isAccountOpen ? "open" : ""}`}>
          <a
            onClick={() => setIsAccountOpen(!isAccountOpen)}
            style={{
              fontSize: "20px",
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <img
              className="li-icon"
              src="/images/icon/user.png"
              alt="account"
            />
            {t("Account Management")}
            <span
              style={{
                marginLeft: "auto",
                opacity: 0.7,
                transition: "transform 0.2s ease",
                transform: isAccountOpen ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              ▸
            </span>
          </a>

          {isAccountOpen && (
            <ul className="submenu">
               <li>
                <NavLink
                  to="/account-management"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  {t("Account Information")}
                </NavLink>
              </li>
              {canSeeUnlockAccount && (
                <li>
                  <NavLink
                    to="/unlock-account"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    {t("Unlock Account")}
                  </NavLink>
                </li>
              )}
              {canSeeSessionManagement && (
                <li>
                  <NavLink
                    to="/session-management"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    {t("Session Management")}
                  </NavLink>
                </li>
              )}
              {canSeeStaffRequests && (
                <li>
                  <NavLink
                    to="/staff-requests"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    {t("Staff Requests")}
                  </NavLink>
                </li>
              )}
              {canSeeManageData && (
                <li>
                  <NavLink
                    to="/manage-data"
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    {t("Manage Data")}
                  </NavLink>
                </li>
              )}
              <li>
                <NavLink
                  to="/change-password"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  {t("Change Password")}
                </NavLink>
              </li>
            </ul>
          )}
        </li>

        <li>
          <a style={{ fontSize: "20px" }}>
            <img
              className="li-icon"
              src="/images/icon/settings.png"
              alt="settings"
            />
            {t("Setting")}
          </a>
        </li>

        <li>
          <a
            onClick={() =>
              i18n.changeLanguage(i18n.language === "en" ? "th" : "en")
            }
            style={{ fontSize: "20px" }}
          >
            <img
              className="li-icon"
              src="/images/icon/translator.png"
              alt="lang"
            />
            EN/TH
          </a>
        </li>

        <li>
          {/* กันเด้งขึ้นบนสุด */}
          <a href="#" onClick={(e) => e.preventDefault()}>
            <img className="li-icon" src="" alt="" />
            <Button onClick={handleLogoutClick}>{t("logout")}</Button>
          </a>
        </li>
      </ul>
    </div>
  );
};

export default MenuPage;
