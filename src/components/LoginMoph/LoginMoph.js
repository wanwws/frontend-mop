import React, { useEffect, useState } from "react";
import { Input, Form, message } from "antd";
import { useNavigate } from "react-router-dom";
import i18n from "../../i18n";
import axios from "axios";
import BASE_URL from "../../config/apiConfig";
import { useTranslation } from "react-i18next";
import AnnouncementBar from "../AnnouncementBar";

const LoginMoph = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  const clearSession = () => {
    [
      "token",
      "roleID",
      "username",
      "provinceCode",
      "districtCode",
      "hospitalCode",
      "userInfo",
    ].forEach((key) => {
      localStorage.removeItem(key);
    });
  };

  useEffect(() => {
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
        setIsLoggedIn(true);
        message.success(t("Already login"));
        navigate("/");
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.warn(
            "Token expired or invalid:",
            error.response.data.message
          );
          clearSession();
          setIsLoggedIn(false);
          message.warning(t("Session expired. Please login again."));
        }
      }
    };
    checkTokenValidity();
  }, [navigate]);

  const onFinish = async (values) => {
    const { username, password } = values;

    try {
      const response = await axios.post(
        `${BASE_URL}/staff/auth/login`,
        { username, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.statusCode === 200) {
        message.success(t("Login successful!"));
        const userData = response.data.data;

        localStorage.setItem("token", userData.token);
        localStorage.setItem("roleID", userData.roleID);
        localStorage.setItem("username", userData.username);
        localStorage.setItem("provinceCode", userData.provinceCode || "");
        localStorage.setItem("districtCode", userData.districtCode || "");
        localStorage.setItem("userInfo", JSON.stringify(userData));
        form.resetFields();
        navigate("/");
      } else {
        message.error(response.data?.message || t("Invalid credentials"));
      }
    } catch (error) {
      message.error(
        error.response?.data?.message || t("An error occurred during login.")
      );
    }
  };
  const handleLanguageChange = (e) => {
    const selectedLang = e.target.value;
    i18n.changeLanguage(selectedLang);
  };
  return (
    <div className="main-bg">
       <AnnouncementBar />
      <div className="top-nav">
        <div className="logo-box">
          <img
            className="moph-logo"
            src="/images/moph-logo.png"
            alt="moph-logo"
          />
          <img
            className="hitap-logo"
            src="/images/hitap-logo.png"
            alt="hitap-logo"
          />
        </div>
        <div className="translate-box">
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
      <div className="login-container">
        <div className="login-logo">
          <img src="/images/login-logo.png" alt="login-logo" />
        </div>
        <div className="login-side">
          <Form className="login-box" form={form} onFinish={onFinish}>
            <div className="title">{t("LOGIN")}</div>
            <div className="login-input-group">
              <Form.Item
                name="username"
                rules={[
                  { required: true, message: t("Please input your username!") },
                ]}
              >
                <Input
                  prefix={
                    <img
                      src="/images/icon/icon-account.png"
                      alt="icon-username"
                    />
                  }
                  placeholder={t("Username")}
                  className="input-form"
                />
              </Form.Item>
            </div>
            <div className="login-input-group login-password">
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: t("Please input your password!") },
                ]}
              >
                <Input.Password
                  prefix={
                    <img src="/images/icon/icon-lock.png" alt="icon-password" />
                  }
                  placeholder={t("Password")}
                  className="input-form"
                />
              </Form.Item>
            </div>

            <button className="btn btn-theme-success btn-login">
              <img src="/images/icon/icon-account-white.png" alt="icon-login" />
              <span>{t("login")}</span>
            </button>
            <p
              style={{
                cursor: "pointer",
                marginTop: "10px",
                color: "#1890ff",
                textAlign: "center",
              }}
              onClick={() => navigate("/forgot-password")}
            >
              {t("Forgot password?")}
            </p>
           
  <span
    style={{
                cursor: "pointer",
                marginTop: "10px",
                color: "#1890ff",
                textAlign: "center",
              }}
    onClick={() => navigate("/resend-mail")}
  >
    {t("Resend confirm mail")}
  </span>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default LoginMoph;
