/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from "react";
import { Button, Dropdown, Menu, message, Modal, Pagination } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import i18n from "../../i18n";
import "bootstrap/dist/css/bootstrap.min.css";
import BASE_URL from "../../config/apiConfig";
import MenuPage from "../Menu/MenuPage";

const ExportData = () => {
  const navigate = useNavigate();
  const userRole = parseInt(localStorage.getItem("roleID"), 10);
  const isHospital = userRole === 4;

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [hospitals, setHospitals] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedHospitalName, setSelectedHospitalName] = useState(""); // ใช้แสดง dropdown
  const [selectedHospitalCode, setSelectedHospitalCode] = useState(""); // ใช้ส่ง API
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const { t } = useTranslation();
  const currentLang = i18n.language;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

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

  useEffect(() => {
    if (isHospital) {
      (async () => {
        try {
          const provinceRes = await axios.get(`${BASE_URL}/master/province`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          });
          setSelectedProvince(provinceRes.data.data[0]?.nameTH || "");

          const districtRes = await axios.get(`${BASE_URL}/master/district`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          });
          setSelectedDistrict(districtRes.data.data[0]?.nameTH || "");

          const hospitalRes = await axios.get(`${BASE_URL}/master/hospital`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          });

          const hospitalData = hospitalRes.data.data[0] || {};
          localStorage.setItem("hospitalCode", hospitalData.hospitalCode);

          if (hospitalData.hospitalCode) {
            setSelectedHospitalName(hospitalData.nameTH);
            fetchRecords(hospitalData.hospitalCode, selectedDate);
          } else {
            console.warn("⚠️ No hospitalCode found!");
            setError("Hospital data not found.");
          }
        } catch (error) {
          console.error("❌ Error fetching hospital data:", error);
          message.error("Error fetching hospital data.");
        }
      })();
    }
  }, [isHospital]);

  useEffect(() => {
    if (!isHospital) {
      axios
        .get(`${BASE_URL}/master/province`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        .then((res) => setProvinces(res.data.data))
        .catch((err) => console.error("Error fetching provinces:", err));
    }
  }, [isHospital]);

  useEffect(() => {
    if (!isHospital && selectedProvince) {
      setDistricts([]);
      setHospitals([]);
      setSelectedDistrict("");
      setSelectedHospitalCode("");
      setSelectedHospitalName("");

      axios
        .get(`${BASE_URL}/master/district`, {
          params: { provinceCode: selectedProvince },
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        .then((res) => setDistricts(res.data.data))
        .catch((err) => console.error("Error fetching districts:", err));
    }
  }, [selectedProvince, isHospital]);

  useEffect(() => {
    if (!isHospital && selectedDistrict) {
      setHospitals([]);
      setSelectedHospitalCode("");
      setSelectedHospitalName("");

      axios
        .get(`${BASE_URL}/master/hospital`, {
          params: {
            districtCode: selectedDistrict,
            provinceCode: selectedProvince,
          },
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        .then((res) => setHospitals(res.data.data))
        .catch((err) => console.error("Error fetching hospitals:", err));
    }
  }, [selectedDistrict, isHospital]);

  // เอาไว้ใช้กับฝั่ง hospital role เท่านั้น
  const hospitalCodeFromStorage = localStorage.getItem("hospitalCode");

  // ถ้าเป็นโรงพยาบาล ใช้ hospitalCode จาก localStorage
  useEffect(() => {
    if (isHospital && hospitalCodeFromStorage && selectedDate) {
      fetchRecords(hospitalCodeFromStorage, selectedDate, page);
    }
  }, [isHospital, selectedDate, page]);

  // ถ้าไม่ใช่โรงพยาบาล ใช้ selectedHospitalCode จาก dropdown เท่านั้น
  useEffect(() => {
    if (!isHospital && selectedHospitalCode && selectedDate) {
      fetchRecords(selectedHospitalCode, selectedDate, page);
    } else if (!isHospital) {
      setRecords([]); // เคลียร์ list ทันทีเมื่อ hospital ยังไม่ถูกเลือก
    }
  }, [selectedHospitalCode, selectedDate, isHospital, page]);

  const fetchRecords = (hospitalCode, date, currentPage = 1) => {
    if (!hospitalCode) {
      console.error("❌ Hospital code is missing!");
      setError("Hospital code is missing.");
      return;
    }

    const params = {
      hospitalCode,
      currentDate: date,
      page: currentPage,
      size: 10,
    };

    setLoading(true);
    axios
      .get(`${BASE_URL}/activity/history/list`, {
        params,
        headers: { Authorization: `Bearer ${getToken()}` },
      })

      .then((res) => {
        setRecords(res.data.data || []);
        setTotalRecords(res.data.pageData?.totalCount || 0);
      })
      .catch((err) => {
        console.error("API Error:", err);
        setError(err.response?.data?.message || "Failed to load data.");
      })
      .finally(() => setLoading(false));
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

  const exportData = async (type) => {
    try {
      const token = getToken();
      if (!token) {
        message.error("Missing token!");
        return;
      }

      // 1) เก็บ quarterInputID ของ record ที่ถูกเลือก
      const selected = records
        .filter((record) => record.isChecked)
        .map((item) => item.quarterInputID);

      if (selected.length === 0) {
        message.warning("Please select at least one record.");
        return;
      }

      const body = {
        quarterInputList: selected,
        hospitalCode: selectedHospitalCode || hospitalCodeFromStorage,
        type: type, // "csv" / "pdf"
      };

      const res = await axios.post(`${BASE_URL}/report/THEMS/template`, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data?.statusCode === 200 && res.data?.data) {
        const fileUrl = res.data.data;

        // เปิดลิงก์ให้ดาวน์โหลด
        window.open(fileUrl, "_blank");
        message.success("Export success!");
      } else {
        message.error(res.data?.message || "Export failed");
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || "Export error");
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
                  <p>{t("EXPORT DATA")}</p>
                </div>
              </div>
              <div className="sub-header">
                <div className="filter-bar-report">
                  {/* Dropdown จังหวัด */}
                  <select
                    className="input-theme-select"
                    value={selectedProvince}
                    onChange={(e) => {
                      setSelectedProvince(e.target.value);
                      setSelectedDistrict("");
                      setSelectedHospitalCode("");
                      setSelectedHospitalName("");
                      setRecords([]);
                    }}
                    disabled={isHospital}
                    defaultValue=""
                  >
                    {isHospital ? (
                      <option>{selectedProvince}</option>
                    ) : (
                      <>
                        <option value="">{t("Select Province")}</option>
                        {provinces.map((province) => (
                          <option
                            key={province.provinceCode}
                            value={province.provinceCode}
                          >
                            {province.nameTH}
                          </option>
                        ))}
                      </>
                    )}
                  </select>

                  {/* Dropdown อำเภอ */}
                  <select
                    className="input-theme-select"
                    value={selectedDistrict}
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value);
                      setSelectedHospitalCode("");
                      setSelectedHospitalName("");
                      setRecords([]);
                    }}
                    disabled={isHospital || !selectedProvince}
                    defaultValue=""
                  >
                    {isHospital ? (
                      <option>{selectedDistrict}</option>
                    ) : (
                      <>
                        <option value="">{t("Select District")}</option>
                        {districts.map((district) => (
                          <option
                            key={district.districtCode}
                            value={district.districtCode}
                          >
                            {district.nameTH}
                          </option>
                        ))}
                      </>
                    )}
                  </select>

                  {/* Dropdown โรงพยาบาล */}
                  <select
                    className="input-theme-select"
                    value={selectedHospitalCode}
                    onChange={(e) => {
                      const selectedCode = e.target.value;
                      const selectedName =
                        hospitals.find((h) => h.hospitalCode === selectedCode)
                          ?.nameTH || "";

                      setSelectedHospitalCode(selectedCode);
                      setSelectedHospitalName(selectedName);

                      localStorage.setItem("hospitalCode", selectedCode);
                    }}
                    disabled={isHospital || !selectedDistrict}
                  >
                    {isHospital ? (
                      <option>{selectedHospitalName}</option> // ใช้ selectedHospitalName
                    ) : (
                      <>
                        <option value="">{t("Select Hospital")}</option>
                        {hospitals.map((hospital) => (
                          <option
                            key={hospital.hospitalCode}
                            value={hospital.hospitalCode}
                          >
                            {hospital.nameTH}
                          </option>
                        ))}
                      </>
                    )}
                  </select>

                  {/* Input Date */}
                  {/* <div className="date-form">
                    <input
                      type="date"
                      className="input-theme-date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                      }}
                    />
                  </div> */}
                </div>
              </div>
            </div>
            <div className="content-body">
              <div className="table-report-responsive">
                {loading && (
                  <p className="text-center">
                    {t("Please select province, district and hospital.")}
                  </p>
                )}
                {error && <p className="text-center text-danger">{error}</p>}
                {!loading && !error && (
                  <table className="table table-report">
                    <thead>
                      <tr>
                        <th className="text-center"></th>
                        <th className="text-center">#</th>
                        <th className="text-center">{t("Month")}</th>
                        <th className="text-center">{t("Year")}</th>
                        <th className="text-center">{t("Record Date/Time")}</th>
                        <th className="text-center">{t("Recorder")}</th>
                        <th className="text-center">{t("Status")}</th>
                        <th className="text-center">{t("View")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.length > 0 ? (
                        records.map((record, index) => (
                          <tr key={record.id}>
                            <td className="text-center">
                              <input
                                type="checkbox"
                                disabled={record.statusID !== 3} // ❌ disable ถ้ายังไม่ submit
                                onChange={(e) => {
                                  const updated = [...records];
                                  updated[index].isChecked = e.target.checked;
                                  setRecords(updated);
                                }}
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  accentColor: "#0D7664", // สีเขียว MOPH
                                  cursor:
                                    record.statusID !== 3
                                      ? "not-allowed"
                                      : "pointer",
                                }}
                              />
                            </td>
                            <td className="text-center">{index + 1}</td>
                            <td
                              className="text-center"
                              style={{ width: "280px" }}
                            >
                              {(currentLang === "th"
                                ? record.monthTH
                                : record.monthEN) || "-"}
                            </td>
                            <td className="text-center">
                              {record.year || "-"}
                            </td>
                            <td className="text-center">
                              {record.createdAt || "-"}
                            </td>
                            <td className="text-center">
                              {record.createdByUserName || "-"}
                            </td>
                            <td className="text-center">
                              {record.statusID === 3 ? (
                                <img
                                  src="/images/icon/icon-check-green.png"
                                  alt="Approved"
                                  className="icon-view"
                                />
                              ) : (
                                <span>-</span>
                              )}
                            </td>
                            <td className="text-center">
                              <img
                                className="icon-view"
                                src="/images/icon/icon-arrow-circle-right.png"
                                alt="View"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const emissionData = {
                                    quarterInputID: record.quarterInputID,
                                    quarterBudgetID: record.quarterBudgetID,
                                    historyID: record.historyID,
                                    statusID: record.statusID,
                                    year: record.year,
                                  };
                                  localStorage.setItem(
                                    "emissionData",
                                    JSON.stringify(emissionData)
                                  );
                                  navigate("/add-record", {
                                    state: emissionData,
                                  });
                                }}
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center">
                            {t("No records found")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
                {/* ✅ ปุ่ม Export ใต้ตารางตรงที่มึงวงแดงไว้ */}
                {!loading && !error && records.length > 0 && (
                  <div
                    className="pagination-container"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "20px",
                      marginBottom: "40px",
                      padding: "0 24px",
                    }}
                  >
                    {/* ปุ่ม Export พร้อม Dropdown UI */}
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: "csv",
                            label: "THEMS Report (CSV)",
                            onClick: () => exportData("csv"),
                          },
                          {
                            key: "pdf",
                            label: "THEMS Report (PDF)",
                            onClick: () => exportData("pdf"),
                          },
                        ],
                      }}
                      placement="topLeft"
                      trigger={["click"]}
                    >
                      <Button
                        type="primary"
                        size="large"
                        style={{
                          backgroundColor: "#0D7664",
                          borderColor: "#0D7664",
                          color: "white",
                          borderRadius: "10px",
                          padding: "0 40px",
                          height: "48px",
                          fontWeight: "500",
                          fontSize: "18px",
                          boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                        }}
                      >
                        {t("Export")} <DownOutlined />
                      </Button>
                    </Dropdown>

                    {/* Pagination */}
                    <Pagination
                      current={page}
                      total={totalRecords}
                      pageSize={10}
                      onChange={(newPage) => setPage(newPage)}
                      showSizeChanger={false}
                    />
                  </div>
                )}
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

export default ExportData;
