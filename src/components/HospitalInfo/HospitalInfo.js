/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, message, Modal } from "antd";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import process from "../process";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import BASE_URL from "../../config/apiConfig";
import MenuPage from "../Menu/MenuPage";

const HospitalInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const recordData =
    location.state || JSON.parse(localStorage.getItem("emissionData")) || {};
  const [quarterInputID, setQuarterInputID] = useState(
    recordData.quarterInputID || ""
  );
  const [statusID, setStatusID] = useState(recordData.statusID || "");
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [loading, setLoading] = useState(false);
  const [serviceName, setServiceName] = useState("");
  const [hospitalType, setHospitalType] = useState("");
  const [hospitalID, setHospitalID] = useState("");
  const [hospital, setHospital] = useState("");
  const [numBeds, setNumBeds] = useState("");
  const [areaHealth, setAreaHealth] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [scopePercentages, setScopePercentages] = useState({});
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [scopeBlocked, setScopeBlocked] = useState(false);
  const { t } = useTranslation();

  const sessionChecked = React.useRef(false);
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
  // === Check Session ===
  useEffect(() => {
    if (sessionChecked.current) return;
    sessionChecked.current = true;

    const token = getToken();
    const hospitalCode = localStorage.getItem("hospitalCode");

    if (!token || !hospitalCode || !quarterInputID) return;

    const createSession = async (authToken = token) => {
      try {
        const res = await axios.post(
          `${BASE_URL}/staff/auth/session`,
          { hospitalCode, quarterInputID },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        // ✅ สร้าง session สำเร็จ
        if (res.data.statusCode === 200) {
          localStorage.setItem("quarterInputID", quarterInputID);
          localStorage.setItem("hospitalCode", hospitalCode);
          localStorage.setItem(
            "currentSession",
            JSON.stringify({ hospitalCode, quarterInputID })
          );
        }
      } catch (err) {
        if (err.response?.status === 401) {
          try {
            console.warn("🔄 Token expired, refreshing...");
            const oldToken = localStorage.getItem("token");
            const refreshRes = await axios.post(
              `${BASE_URL}/staff/auth/refresh/token`,
              {},
              { headers: { Authorization: `Bearer ${oldToken}` } }
            );

            const newToken = refreshRes.data?.data?.token;
            if (newToken) {
              localStorage.setItem("token", newToken);
              const oldUserInfo = JSON.parse(
                localStorage.getItem("userInfo") || "{}"
              );
              const newUserInfo = { ...oldUserInfo, token: newToken };
              localStorage.setItem("userInfo", JSON.stringify(newUserInfo));

              await createSession(newToken);
              return;
            }
          } catch (refreshErr) {
            console.error("❌ Refresh token failed:", refreshErr);
            message.error("Token หมดอายุ กรุณาเข้าสู่ระบบใหม่");
            localStorage.clear();
            navigate("/");
          }
        } else if (err.response?.status === 403) {
          const data = err.response.data?.data;
          const name = data?.nameTH || data?.nameEN || "";
          const lname = data?.lastnameTH || data?.lastnameEN || "";
          const username = data?.username || "";
          const sessionID = data?.sessionID || "-";

          setScopeBlocked(true);

          Modal.warning({
            title: "พบ Session ที่กำลังใช้งานอยู่",
            content: (
              <div style={{ lineHeight: 1.8 }}>
                <p>
                  มีผู้ใช้งานอยู่ใน session เดียวกัน:
                  <br />
                  <b>
                    {name} {lname}
                  </b>{" "}
                  ({username})
                </p>
      <p style={{ marginTop: 8 }}>
        <p>SessionID:</p> {sessionID}
      </p>
                <p style={{ marginTop: 12 }}>
                  กรุณารอให้ผู้ใช้งานรายนี้ออกจากระบบก่อน
                  <br />
                  หรือกดย้อนกลับเพื่อเลือกข้อมูลอื่น
                </p>
              </div>
            ),
            okText: "ตกลง",
            centered: true,
          });
          return;
        } else {
          console.error("❌ Session creation error:", err);
          message.error("ไม่สามารถสร้าง session ได้");
        }
      }
    };

    createSession();
  }, [quarterInputID]);

  useEffect(() => {
    const keysToRemove = [
      "scope_1",
      "scope_2",
      "scope_3",
      "scope_4",
      "scope_5",
      "is_edit_activity",
      "No11",
      "No12",
      "No19.2",
      "No19.3",
      "No19.4",
      "No19.5",
      "scopePercentages",
      "summaryData",
      "months",
    ];

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
  }, []);

  useEffect(() => {
    const fetchHospitalInfo = async () => {
      const token = getToken();
      const hospitalCode = localStorage.getItem("hospitalCode");

      if (!token) {
        message.warning("No token found. Please login first.");
        return;
      }

      if (!hospitalCode) {
        console.warn("⚠️ No hospitalCode found in localStorage.");
        message.error("No hospital data found.");
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/activity/hospital/info`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { hospitalCode },
        });
        if (response.data?.data?.nameTH) {
          const hospitalList = [
            { code: hospitalCode, name: response.data.data.nameTH },
          ];
          setHospitals(hospitalList);
          setSelectedHospital(hospitalList[0]?.code || "");
          setHospitalType(response.data.data.hospitalType || "N/A");
          setServiceName(response.data.data.serviceName || "N/A");
          setHospitalID(response.data.data.username || "N/A");
          setHospital(response.data.data.nameEN || "N/A");
          setNumBeds(
            response.data.data.amountBeds
              ? `${response.data.data.amountBeds} เตียง`
              : "N/A"
          );
          setAreaHealth(response.data.data.zoneHealth || "N/A");
          setProvince(response.data.data.provinceName || "N/A");
          setDistrict(response.data.data.districtName || "N/A");
        } else {
          message.error("No hospital data found.");
        }
      } catch (error) {
        console.error("❌ Error fetching hospital data:", error);
        message.error(
          error.response?.data?.message || "Failed to fetch hospitals."
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchScopePercentages = async () => {
      const token = getToken();
      const hospitalCode = localStorage.getItem("hospitalCode");
      const queryParams = { quarterInputID, hospitalCode };

      if (!token || !quarterInputID || !hospitalCode) return;

      try {
        const response = await axios.get(`${BASE_URL}/activity/history`, {
          params: queryParams,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.statusCode === 200) {
          const responseData = response.data.data;

          if (!responseData) {
            console.warn("⚠️ No data received from API.");
            return;
          }

          const scopeData = {};
          responseData.activityList.forEach((scope) => {
            scopeData[scope.scopeID] = scope.percentOfData;
          });
          setScopePercentages(scopeData);
          process.setProgress();
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalInfo();
    fetchScopePercentages();
  }, [quarterInputID]);

useEffect(() => {
  const handleBeforeUnload = () => {
    // ปิดแท็บหรือรีเฟรช browser
    sendCloseSession();
  };

  // ผูก event เวลา browser ปิดหน้า/รีเฟรช
  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    // ลบ event listener ตอน component ถูก unmount
    window.removeEventListener("beforeunload", handleBeforeUnload);
    // ตรวจ path ปัจจุบัน เพื่อเช็คว่า navigate ไปไหนต่อ
    const nextUrl = window.location.pathname;
    // หน้าที่ไม่ควรลบ session (ภายใน workflow)
    const safePaths = ["/add-scope", "/add-record"];
    // ✅ ตรวจว่า URL ปัจจุบันเริ่มด้วย safe path หรือไม่
    const isSafe = safePaths.some((path) => nextUrl.startsWith(path));

    // ❌ ถ้าไม่ใช่ safe path แปลว่าออกนอกระบบ เช่น logout / ปิดแท็บ
    if (!isSafe) {
      sendCloseSession();
    }
  };
}, []);


  const handleLogoutClick = async () => {
  const token = getToken();
  const hospitalCode = localStorage.getItem("hospitalCode");
  const quarterInputID = localStorage.getItem("quarterInputID");

  if (!token) {
    message.warning("No token found. Please login first.");
    return;
  }

  try {
    if (hospitalCode && quarterInputID) {
      try {
        await axios.delete(
          `${BASE_URL}/staff/auth/session/${hospitalCode}/${quarterInputID}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("✅ Session deleted successfully before logout");
      } catch (err) {
        console.warn("⚠️ Failed to delete session before logout:", err);
      }
    }
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
    message.success("Logout successful!");
    localStorage.clear();
    navigate("/");

  } catch (error) {
    console.error("❌ Logout error:", error);
    message.error(
      error.response?.data?.message || "Logout failed. Please try again."
    );
  }
};


  const handleBack = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    const hospitalCode = localStorage.getItem("hospitalCode");
    const quarterInputID = localStorage.getItem("quarterInputID");

    // console.log("➡️ handleBack called:", {
    //   token,
    //   hospitalCode,
    //   quarterInputID,
    // });

    if (!token || !hospitalCode || !quarterInputID) {
      console.warn("⚠️ Missing token, hospitalCode or quarterInputID");
      return navigate("/emissions-record");
    }

    try {
      const res = await axios.delete(
        `${BASE_URL}/staff/auth/session/${hospitalCode}/${quarterInputID}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data?.statusCode === 200) {
        // console.log("Session deleted successfully");
        localStorage.removeItem("currentSession");
        localStorage.removeItem("quarterInputID");
        message.success("Session deleted!");
      } else {
        message.warning(res.data?.message || "Delete session failed.");
      }
    } catch (err) {
      console.error("❌ Delete session error:", err);
      message.error(err.response?.data?.message || "Delete session failed.");
    }

    navigate("/emissions-record");
  };

  const handleGoScope = (scopeID) => {
    if (scopeBlocked) {
      Modal.warning({
        title: "ไม่สามารถเข้า Scope ได้",
        content:
          "ขณะนี้มีผู้ใช้งานอยู่ใน session เดียวกัน กรุณารอให้ผู้ใช้นั้นออกจากระบบก่อน",
        okText: "เข้าใจแล้ว",
      });
      return;
    }
    navigate(`/add-scope/${scopeID}`);
  };

  const sendCloseSession = () => {
  const token = localStorage.getItem("token");
  const hospitalCode = localStorage.getItem("hospitalCode");
  const quarterInputID = localStorage.getItem("quarterInputID");

  if (!token || !hospitalCode || !quarterInputID) return;

  const url = `${BASE_URL}/staff/auth/session/${hospitalCode}/${quarterInputID}`;

  try {
    // 🟢 ใช้ fetch แบบ keepalive จะยิงได้แม้แท็บกำลังปิดอยู่
    fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      keepalive: true, // ✅ สำคัญสุด
    });

    console.log("📡 DELETE session sent before tab close");
    localStorage.removeItem("currentSession");
    localStorage.removeItem("quarterInputID");
  } catch (error) {
    console.warn("⚠️ Failed to close session automatically:", error);
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
          <img src="/images/bg-nav.png" alt="" />
        </div>
        <MenuPage handleLogoutClick={handleLogoutClick} />
        <form action="#" className="form-container">
          <div className="content-box">
            <div className="content-header">
              <div className="main-header">
                <div className="title">
                  <img src="/images/icon/icon-plus-circle-green.png" alt="" />
                  <p>{t("add record")}</p>
                </div>
              </div>
              <div className="sub-header-report-process">
                <div className="sub-title process-title">
                  <p className="mb-0 ">{t("process")}</p>
                </div>
                <div className="report-process">
                  <div
                    className="process-group"
                    onClick={() => navigate("/add-record")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="process-count success">
                      <img src="/images/icon/icon-check.png" alt="" />
                    </div>
                    <div className="circleProcess" data-percent="100">
                      <div className="circleProcess__percent">
                        <div className="halfCirlce"></div>
                      </div>
                      <div className="circleProcess__percent">
                        <div className="halfCirlce"></div>
                      </div>
                      <div className="circleProcess__Content">
                        <div className="circleProcess__ContentBox">
                          <p>
                            General <br /> information
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="process-group"
                    onClick={() => handleGoScope(1)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className={`process-count ${
                        scopePercentages[1] === 100
                          ? "success"
                          : scopePercentages[1] > 0
                          ? "pending"
                          : "none"
                      }`}
                    >
                      <p>{scopePercentages[1]}</p>
                      <span>%</span>
                    </div>
                    <div
                      className="circleProcess"
                      data-percent={scopePercentages[1]}
                    >
                      <div className="circleProcess__percent">
                        <div className="halfCirlce"></div>
                      </div>
                      <div className="circleProcess__percent">
                        <div className="halfCirlce"></div>
                      </div>
                      <div className="circleProcess__Content">
                        <div className="circleProcess__ContentBox">
                          <span>SCOPE 1</span>
                          <p>
                            Direct <br /> Emission
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="process-group"
                    onClick={() => handleGoScope(2)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className={`process-count ${
                        scopePercentages[2] === 100
                          ? "success"
                          : scopePercentages[2] > 0
                          ? "pending"
                          : "none"
                      }`}
                    >
                      <p>{scopePercentages[2]}</p>
                      <span>%</span>
                    </div>
                    <div
                      className="circleProcess"
                      data-percent={scopePercentages[2]}
                    >
                      <div className="circleProcess__percent">
                        <div className="halfCirlce"></div>
                      </div>
                      <div className="circleProcess__percent">
                        <div className="halfCirlce"></div>
                      </div>
                      <div className="circleProcess__Content">
                        <div className="circleProcess__ContentBox">
                          <span>SCOPE 2</span>
                          <p>
                            Indirect <br /> Emission
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="process-group"
                    onClick={() => handleGoScope(3)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className={`process-count ${
                        scopePercentages[3] === 100
                          ? "success"
                          : scopePercentages[3] > 0
                          ? "pending"
                          : "none"
                      }`}
                    >
                      <p>{scopePercentages[3]}</p>
                      <span>%</span>
                    </div>
                    <div
                      className="circleProcess"
                      data-percent={scopePercentages[3]}
                    >
                      <div className="circleProcess__percent">
                        <div className="halfCirlce"></div>
                      </div>
                      <div className="circleProcess__percent">
                        <div className="halfCirlce"></div>
                      </div>
                      <div className="circleProcess__Content">
                        <div className="circleProcess__ContentBox">
                          <span>SCOPE 3</span>
                          <p>
                            Indirect <br /> Emission
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="process-group"
                    onClick={() => handleGoScope(4)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className={`process-count ${
                        scopePercentages[4] === 100
                          ? "success"
                          : scopePercentages[4] > 0
                          ? "pending"
                          : "none"
                      }`}
                    >
                      <p>{scopePercentages[4]}</p>
                      <span>%</span>
                    </div>
                    <div
                      className="circleProcess"
                      data-percent={scopePercentages[4]}
                    >
                      <div className="circleProcess__percent">
                        <div className="halfCirlce"></div>
                      </div>
                      <div className="circleProcess__percent">
                        <div className="halfCirlce"></div>
                      </div>
                      <div className="circleProcess__Content">
                        <div className="circleProcess__ContentBox">
                          <span>Other Scope</span>
                          <p>
                            NON <br /> Protocol
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className="process-group"
                    onClick={() => handleGoScope(5)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className={`process-count ${
                        scopePercentages[5] === 100
                          ? "success"
                          : scopePercentages[5] > 0
                          ? "pending"
                          : "none"
                      }`}
                    >
                      <p>{scopePercentages[5]}</p>
                      <span>%</span>
                    </div>
                    <div
                      className="circleProcess"
                      data-percent={scopePercentages[5]}
                    >
                      <div className="circleProcess__percent">
                        <div className="halfCirlce"></div>
                      </div>
                      <div className="circleProcess__percent">
                        <div className="halfCirlce"></div>
                      </div>
                      <div className="circleProcess__Content">
                        <div className="circleProcess__ContentBox">
                          {/* <span>Scope Of</span> */}
                          <p>
                            Emission <br /> Reduction <br />
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="process-group final-process">
                    <div className="precess-line"></div>
                    <img
                      src={
                        statusID === 3
                          ? "/images/check.png"
                          : "/images/process-final.png"
                      }
                      alt="Process Final"
                      style={{ width: "35px" }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="content-body">
              <div className="form-add-record">
                <p className="title">{t("General information")}</p>
                <div className="panel-add-record custom-panel">
                  {loading ? (
                    <p className="text-center text-muted">
                      {t("Loading hospital data...")}
                    </p>
                  ) : (
                    <table className="table custom-table">
                      <tbody>
                        <tr>
                          <td className="table-label">{t("Hospital ID")}</td>
                          <td>{hospitalID}</td>
                          <td className="table-label">{t("Hospital Name")}</td>
                          <td>{hospital}</td>
                        </tr>
                        <tr>
                          <td className="table-label">{t("Hospital Type")}</td>
                          <td>{hospitalType}</td>
                          <td className="table-label">{t("Service Plan")}</td>
                          <td>{serviceName}</td>
                        </tr>
                        <tr>
                          <td className="table-label">
                            {t("Number of Beds (2025)")}
                          </td>
                          <td>{numBeds}</td>
                          <td className="table-label">{t("Area Health")}</td>
                          <td>{areaHealth}</td>
                        </tr>
                        <tr>
                          <td className="table-label">{t("Province")}</td>
                          <td>{province}</td>
                          <td className="table-label">{t("District")}</td>
                          <td>{district}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="form-add-report-action">
            <button
              type="button"
              className="btn btn-page-step"
              onClick={handleBack}
            >
              <img src="/images/icon/previous-button.png" alt="" />
            </button>
            <button
              type="button"
              className="btn btn-page-step"
              onClick={() => handleGoScope(1)}
            >
              <img src="/images/icon/next-button.png" alt="" />
            </button>
          </div>
        </form>
      </div>
      {/* Footer */}
      <footer>
        <div className="contact" style={{ marginTop: "80px" }}>
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

export default HospitalInfo;
