/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from "react";
import { Table, Button, Popconfirm, message, Input } from "antd";
import { useTranslation } from "react-i18next";
import axios from "axios";
import BASE_URL from "../../config/apiConfig";
import MenuPage from "../Menu/MenuPage";
import { useNavigate } from "react-router-dom";
import { ReloadOutlined } from "@ant-design/icons";
import AnnouncementBar from "../AnnouncementBar";

const SessionManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem("token");

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/staff/auth/session`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.data.statusCode === 200) {
        setSessions(res.data.data || []);
      } else {
        message.error(res.data.message || "Failed to load sessions");
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      message.error("Error fetching sessions");
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (hospitalCode, quarterInputID) => {
    try {
      await axios.delete(
        `${BASE_URL}/staff/auth/session/${hospitalCode}/${quarterInputID}`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
          data: { quarterInputID, hospitalCode },
        }
      );
      message.success("Session deleted successfully");
      fetchSessions();
    } catch (err) {
      console.error("Delete session error:", err);
      message.error("Failed to delete session");
    }
  };

  const columns = [
    {
      title: t("Hospital Code"),
      dataIndex: "hospitalCode",
      key: "hospitalCode",
    },
    { title: "Quarter ID", dataIndex: "quarterInputID", key: "quarterInputID" },
    { title: "User ID", dataIndex: "userID", key: "userID" },
    { title: "Username", dataIndex: "username", key: "username" },
    {
      title: "Name (TH)",
      dataIndex: "nameTH",
      key: "nameTH",
      render: (v) => v || "-",
    },
    {
      title: "Lastname (TH)",
      dataIndex: "lastnameTH",
      key: "lastnameTH",
      render: (v) => v || "-",
    },
    {
      title: "Name (EN)",
      dataIndex: "nameEN",
      key: "nameEN",
      render: (v) => v || "-",
    },
    {
      title: "Lastname (EN)",
      dataIndex: "lastnameEN",
      key: "lastnameEN",
      render: (v) => v || "-",
    },
    { title: "Session ID", dataIndex: "sessionID", key: "sessionID" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="Delete this session?"
          onConfirm={() =>
            deleteSession(record.hospitalCode, record.quarterInputID)
          }
          okText="Yes"
          cancelText="No"
        >
          <Button danger size="small">
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  useEffect(() => {
    fetchSessions();
  }, []);

  // logout handler (แก้ไขใหม่)
  const handleLogoutClick = async () => {
    const token = getToken();
    try {
      if (token) {
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
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.clear();
      message.success(t("Logout successful!"));
      navigate("/");
    }
  };

  const filteredSessions = sessions.filter((item) => {
    const keyword = searchKeyword.toLowerCase();

    return (
      (item.username || "").toLowerCase().includes(keyword) ||
      (item.sessionID || "").toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="main-bg">
      <AnnouncementBar />
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
                  <p style={{ margin: 0 }}>{t("SESSION MANAGEMENT")}</p>
                </div>
              </div>
            </div>

            <div className="content-body">
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                {/* <h3>{t("Session Lists")}</h3> */}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: 16,
                  gap: 10,
                }}
              >
                <Input
                  placeholder={t("Search Username or Session ID")}
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  allowClear
                  style={{ width: 280 }}
                />

                <Button
                  onClick={fetchSessions}
                  loading={loading}
                  type="primary"
                >
                  <ReloadOutlined /> {t("Refresh")}
                </Button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <Table
                  rowKey="sessionID"
                  dataSource={filteredSessions}
                  columns={columns}
                  loading={loading}
                  pagination={{ pageSize: 10, responsive: true }}
                  bordered
                  scroll={{ x: true }}
                />
              </div>
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
            onClick={() => message.info("Contact info here")}
            style={{ cursor: "pointer" }}
          >
            {t("Contact Information")}
          </p>
        </div>
        <p className="footer">Copyright © by Ministry of Public Health 2025</p>
      </footer>
    </div>
  );
};

export default SessionManagement;
