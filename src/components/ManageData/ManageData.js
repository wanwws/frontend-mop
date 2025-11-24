import React, { useState } from "react";
import { Button, message, Pagination, Input, Modal } from "antd";
import { useTranslation } from "react-i18next";
import axios from "axios";
import MenuPage from "../Menu/MenuPage";
import BASE_URL from "../../config/apiConfig";
import { useNavigate } from "react-router-dom";

const ManageData = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [hospitalCode, setHospitalCode] = useState("");
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [selectedHistoryID, setSelectedHistoryID] = useState(null);

  const token = localStorage.getItem("token");

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

  const fetchList = async (pageNum = 1) => {
    if (!hospitalCode) {
      return message.warning(t("Please input hospitalCode."));
    }

    setLoading(true);
    setRecords([]);

    try {
      const res = await axios.get(`${BASE_URL}/activity/history/list`, {
        params: {
          hospitalCode: hospitalCode,
          currentDate: new Date().toISOString().split("T")[0],
          page: pageNum,
          size: 10,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      setRecords(res.data.data || []);
      setTotalRecords(res.data.pageData?.totalCount || 0);
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || t("Error retrieving data"));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchList(1);
  };

  const revertStatus = async () => {
    if (!selectedHistoryID) return;

    try {
      const res = await axios.put(
        `${BASE_URL}/activity/history/status`,
        {
          historyID: selectedHistoryID,
          status: 2,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      message.success(t("Revert to save draft successfully!"));
      setIsRevertModalOpen(false);
      fetchList(page); // reload data
    } catch (err) {
      console.error(err);
      message.error(
        err.response?.data?.message || t("Failed to update status")
      );
    }
  };

  return (
    <div className="main-bg">
      <div className="main-container">
        <div className="bg-overlay">
          <img src="/images/bg-nav.png" alt="Background" />
        </div>

        <MenuPage handleLogoutClick={handleLogoutClick} />

        <div className="form-container">
          <div className="content-box">
            {/* ===== HEADER ===== */}
            <div className="content-header">
              <div className="main-header">
                <div className="title" style={{ display: "flex", gap: 10 }}>
                  <img src="/images/icon/icon-record.png" alt="icon" />
                  <p>{t("MANAGE DATA")}</p>
                </div>
              </div>

              {/* ===== SEARCH BAR ===== */}
              <div className="sub-header">
                <div className="filter-bar-report" style={{ gap: "10px" }}>
                  <Input
                    placeholder={t("Hospital Code")}
                    className="input-theme-text"
                    value={hospitalCode}
                    onChange={(e) => {
                      const value = e.target.value;
                      setHospitalCode(value);

                      // ❗ ถ้ากด clear → เคลียร์ตาราง
                      if (!value) {
                        setRecords([]);
                        setTotalRecords(0);
                        setPage(1);
                      }
                    }}
                    allowClear
                    style={{ width: "200px" }}
                  />

                  <Button
                    type="primary"
                    style={{
                      background: "#0D7664",
                      borderColor: "#0D7664",
                      height: "40px",
                      borderRadius: "10px",
                    }}
                    onClick={handleSearch}
                  >
                    {t("Search")}
                  </Button>
                </div>
              </div>
            </div>

            {/* ===== TABLE ===== */}
            <div className="content-body">
              <div className="table-report-responsive">
                <table className="table table-report">
                  <thead>
                    <tr>
                      <th className="text-center">#</th>
                      <th className="text-center">{t("Month")}</th>
                      <th className="text-center">{t("Year")}</th>
                      <th className="text-center">{t("Record Date/Time")}</th>
                      <th className="text-center">{t("Recorder")}</th>
                      <th className="text-center">{t("Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.length > 0 ? (
                      records.map((record, idx) => (
                        <tr key={record.historyID}>
                          <td className="text-center">
                            {(page - 1) * 10 + idx + 1}
                          </td>
                          <td className="text-center">{record.monthTH}</td>
                          <td className="text-center">{record.year}</td>
                          <td className="text-center">{record.createdAt}</td>
                          <td className="text-center">
                            {record.createdByUserName}
                          </td>
                          <td className="text-center">
                            {record.statusID === 3 ? (
                              <img
                                src="/images/icon/icon-check-green.png"
                                alt="status"
                                className="icon-view"
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                  setSelectedHistoryID(record.historyID);
                                  setIsRevertModalOpen(true);
                                }}
                              />
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">
                          {loading
                            ? t("Loading...")
                            : t(
                                "No records found. Please search hospital code."
                              )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {records.length > 0 && (
                  <Pagination
                    current={page}
                    pageSize={10}
                    total={totalRecords}
                    onChange={(newPage) => {
                      setPage(newPage);
                      fetchList(newPage);
                    }}
                    style={{ marginTop: 20 }}
                  />
                )}
              </div>
            </div>
            <Modal
              open={isRevertModalOpen}
              onCancel={() => setIsRevertModalOpen(false)}
              onOk={revertStatus}
              okText={t("Confirm")}
              cancelText={t("Cancel")}
              centered
            >
              <p style={{ fontSize: "16px" }}>
                {t("Do you want to revert this record to save draft?")}
              </p>
            </Modal>
          </div>
        </div>
      </div>
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

export default ManageData;
