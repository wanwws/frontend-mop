import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { message, Input, Button, Card, Form } from "antd";
import { LockOutlined, CheckCircleTwoTone, CloseCircleTwoTone } from "@ant-design/icons";
import BASE_URL from "../../config/apiConfig";

const FirstTimePassword = () => {
  const navigate = useNavigate();
  const { token: paramToken } = useParams();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [token, setToken] = useState("");
  const [passwordRules, setPasswordRules] = useState({
    length: false,
    upper: false,
    lower: false,
    digit: false,
    symbol: false,
    noSpace: false,
  });

  // ✅ ดึง token จาก path หรือ query string
  useEffect(() => {
    let code = paramToken;
    if (!code) {
      const params = new URLSearchParams(location.search);
      code = params.get("token");
    }
    if (code) {
      setToken(code);
    } else {
      message.error("ไม่พบ token");
      navigate("/login-moph");
    }
  }, [paramToken, location, navigate]);

  // ✅ ฟังก์ชันเช็ค strength
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

  // ✅ rule validate
  const validateStrongPassword = async (_, value) => {
    if (!value) return Promise.reject(new Error("กรุณากรอกรหัสผ่านใหม่"));
    const { length, upper, lower, digit, symbol, noSpace } = passwordRules;
    if (!length || !upper || !lower || !digit || !symbol || !noSpace) {
      return Promise.reject(new Error("รหัสผ่านไม่ตรงตามเงื่อนไขความปลอดภัย"));
    }
    return Promise.resolve();
  };

  // ✅ submit
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/staff/auth/firsttime/password`,
        { token, password: values.newPassword },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data?.statusCode === 200) {
        message.success("ตั้งรหัสผ่านครั้งแรกสำเร็จ! กรุณาเข้าสู่ระบบ");
        navigate("/login-moph");
      } else {
        message.error(res.data?.message || "ไม่สามารถตั้งรหัสผ่านได้");
      }
    } catch (err) {
      console.error("API error:", err.response || err);
      message.error(err.response?.data?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  // ✅ render rule แสดง checklist
  const renderRule = (ok, text) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {ok ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <CloseCircleTwoTone twoToneColor="#ff4d4f" />}
      <span>{text}</span>
    </div>
  );

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
        <h2 style={{ textAlign: "center", color: "#28a745", marginBottom: 20, fontWeight: 700, fontSize: 22 }}>
          🔑 ตั้งรหัสผ่านครั้งแรก
        </h2>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="รหัสผ่านใหม่"
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

          <div style={{ marginBottom: 16, fontSize: 13, color: "#444" }}>
            {renderRule(passwordRules.length, "ความยาว 8-16 ตัวอักษร")}
            {renderRule(passwordRules.lower, "อักษรพิมพ์เล็กอย่างน้อย 1 ตัว (a-z)")}
            {renderRule(passwordRules.upper, "อักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว (A-Z)")}
            {renderRule(passwordRules.digit, "ตัวเลขอย่างน้อย 1 ตัว (0-9)")}
            {renderRule(passwordRules.symbol, "อักขระพิเศษอย่างน้อย 1 ตัว เช่น ! @ # $ % ^ & *")}
            {renderRule(passwordRules.noSpace, "ห้ามมีช่องว่าง")}
          </div>

          <Form.Item
            label="ยืนยันรหัสผ่านใหม่"
            name="confirmPassword"
            dependencies={["newPassword"]}
            hasFeedback
            rules={[
              { required: true, message: "กรุณายืนยันรหัสผ่านใหม่" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                  return Promise.reject(new Error("รหัสผ่านยืนยันไม่ตรงกับรหัสผ่านใหม่"));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} size="large" />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            style={{ backgroundColor: "#28a745", borderRadius: 8, height: 45, fontWeight: 600, fontSize: 16 }}
          >
            บันทึกข้อมูล
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default FirstTimePassword;
