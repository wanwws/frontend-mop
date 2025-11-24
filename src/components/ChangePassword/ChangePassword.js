import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { message, Input, Button, Card, Form } from "antd";
import {
  LockOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import BASE_URL from "../../config/apiConfig";
import "../../styles/global.css";

const ChangePassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [passwordRules, setPasswordRules] = useState({
    length: false,
    upper: false,
    lower: false,
    digit: false,
    symbol: false,
    noSpace: false,
  });

  const getToken = () => localStorage.getItem("token");

  const checkPasswordStrength = (value) => {
    setPasswordRules({
      length: value.length >= 8 && value.length <= 16,
      upper: /[A-Z]/.test(value),
      lower: /[a-z]/.test(value),
      digit: /\d/.test(value),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      noSpace: /^\S+$/.test(value),
    });
  };

  const validateStrongPassword = async (_, value) => {
    if (!value)
      return Promise.reject(new Error(t("Please enter your new password")));
    const { length, upper, lower, digit, symbol, noSpace } = passwordRules;
    if (!length || !upper || !lower || !digit || !symbol || !noSpace) {
      return Promise.reject(
        new Error(t("Password does not meet security requirements"))
      );
    }
    const oldPwd = form.getFieldValue("oldPassword");
    if (oldPwd && value === oldPwd) {
      return Promise.reject(
        new Error(t("New password must differ from old password"))
      );
    }
    return Promise.resolve();
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await axios.post(
        `${BASE_URL}/staff/auth/change/password`,
        { oldPassword: values.oldPassword, newPassword: values.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (
        res.data?.statusCode === 200 ||
        (res.data?.message &&
          res.data.message.toLowerCase().includes("success"))
      ) {
        message.destroy();
        message.success(t("Password changed successfully!"));
        navigate("/");
      } else {
        message.destroy();
        message.error(res.data?.message || t("Unable to change password"));
      }
    } catch (err) {
      console.error("API error:", err.response || err);
      message.error(
        err.response?.data?.message || t("An error occurred, please try again")
      );
    } finally {
      setLoading(false);
    }
  };

  const renderRule = (ok, text) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {ok ? (
        <CheckCircleTwoTone twoToneColor="#52c41a" />
      ) : (
        <CloseCircleTwoTone twoToneColor="#ff4d4f" />
      )}
      <span>{text}</span>
    </div>
  );

  return (
    <div
      style={{
        backgroundImage: "url('/images/bg-wave.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Prompt, sans-serif",
      }}
    >
      <Card
        style={{
          width: 470,
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          padding: 24,
          backdropFilter: "blur(2px)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#28a745",
            marginBottom: 20,
            fontWeight: 700,
            fontSize: 30,
          }}
        >
          🔒 {t("Change Password")}
        </h2>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label={<span style={{ fontSize: 16 }}>{t("Old Password")}</span>}
            name="oldPassword"
            rules={[
              { required: true, message: t("Please enter your old password") },
            ]}
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} size="large" />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 16 }}>{t("New Password")}</span>}
            labelCol={{ style: { fontSize: "16px" } }}
            name="newPassword"
            rules={[{ validator: validateStrongPassword, required: true }]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined />}
              size="large"
              onChange={(e) => checkPasswordStrength(e.target.value)}
            />
          </Form.Item>

          <div style={{ marginBottom: 16, fontSize: 15, color: "#444" }}>
            {renderRule(passwordRules.length, t("8-16 characters long"))}
            {renderRule(
              passwordRules.lower,
              t("At least one lowercase letter (a-z)")
            )}
            {renderRule(
              passwordRules.upper,
              t("At least one uppercase letter (A-Z)")
            )}
            {renderRule(passwordRules.digit, t("At least one number (0-9)"))}
            {renderRule(
              passwordRules.symbol,
              t("At least one special character (e.g. ! @ # $ % ^ & *)")
            )}
            {renderRule(passwordRules.noSpace, t("No spaces allowed"))}
          </div>

          <Form.Item
            label={
              <span style={{ fontSize: 16 }}>{t("Confirm New Password")}</span>
            }
            name="confirmPassword"
            dependencies={["newPassword"]}
            hasFeedback
            rules={[
              {
                required: true,
                message: t("Please confirm your new password"),
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value)
                    return Promise.resolve();
                  return Promise.reject(
                    new Error(t("Confirm password does not match new password"))
                  );
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} size="large" />
          </Form.Item>

          {/* ปุ่ม action */}
          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              onClick={() => navigate(-1)}
              block
              style={{
                borderRadius: 8,
                height: 45,
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              {t("Back")}
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              disabled={loading}
              style={{
                backgroundColor: "#28a745",
                borderRadius: 8,
                height: 45,
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              {t("Save Changes")}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ChangePassword;
