import React, { useState } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { MailOutlined, ArrowLeftOutlined, TranslationOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import BASE_URL from "../../config/apiConfig";

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/staff/auth/forget/password`, {
        email: values.email,
      });

      if (res.data?.statusCode === 200) {
        message.success(t("reset_link_sent"));
      } else {
        message.error(res.data?.message || t("error_send_email"));
      }
    } catch (err) {
      console.error("API Error:", err);
      message.error(err.response?.data?.message || t("unexpected_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundImage: "url('/images/bg-wave.png')",
        backgroundSize: "cover",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Prompt, sans-serif",
        padding: 20
      }}
    >
      <Card
        style={{
          width: 440,
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          padding: 24,
          position: "relative",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#28a745",
            marginBottom: 20,
            fontWeight: 700,
            fontSize: 22,
          }}
        >
          🔑 {t("forgot_password")}
        </h2>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label={t("email")}
            name="email"
            rules={[
              { required: true, type: "email", message: t("email_invalid") },
            ]}
          >
            <Input prefix={<MailOutlined />} size="large" placeholder="example@email.com" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            style={{
              backgroundColor: "#28a745",
              borderRadius: 8,
              height: 45,
              marginBottom: 10,
            }}
          >
            {t("send_reset_link")}
          </Button>

          <Button
            icon={<ArrowLeftOutlined />}
            block
            onClick={() => navigate("/login-moph")}
            style={{
              borderRadius: 8,
              height: 45,
            }}
          >
            {t("back_to_login")}
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default ForgotPassword;
