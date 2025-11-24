import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { message, Input, Button, Card, Form } from "antd";
import { ArrowLeftOutlined, MailOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import BASE_URL from "../../config/apiConfig";

const ResendMail = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const { t } = useTranslation();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${BASE_URL}/staff/resend/email/verify`,
        { username: values.username },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.statusCode === 200) {
        message.success(t("email_resend_success"));
      } else {
        message.error(res.data?.message || t("email_resend_failed"));
      }
    } catch (err) {
      console.error("API Error:", err.response || err);
      message.error(err.response?.data?.message || t("something_went_wrong"));
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
      }}
    >
      <Card
        style={{
          width: 440,
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
            fontSize: 22,
          }}
        >
          📧 {t("resend_title")}
        </h2>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label={t("username_label")}
            name="username"
            rules={[{ required: true, message: t("username_required") }]}
          >
            <Input
              prefix={<MailOutlined />}
              size="large"
              placeholder={t("username_placeholder")}
            />
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
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            {t("send_email")}
          </Button>
        </Form>

        <div style={{ marginTop: 20, textAlign: "center" }}>
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
        </div>
      </Card>
    </div>
  );
};

export default ResendMail;
