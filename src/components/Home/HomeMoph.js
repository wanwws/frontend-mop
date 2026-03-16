import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message, Modal } from "antd";
import { useTranslation, Trans } from "react-i18next";
import i18n from "../../i18n";
import axios from "axios";
import process from "../process";
import GrapDashboard from "../graphDashboard";
import GraphReduction from "../graphReduction";
import GraphIntensity from "../graphIntensity";
import GraphZoneHealth from "../graphZoneHealth";
import GraphAnnualEmission from "../graphAnnualEmission";
import BASE_URL from "../../config/apiConfig";
import AnnouncementBar from "../AnnouncementBar";

const HomeMoph = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(false);
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState({
    yearFilter: "calendar",
    yearFrom: currentYear.toString(),
    yearTo: currentYear.toString(),
    provinceCode: "",
    districtCode: "",
    hospitalCode: "",
  });
  const [scopeData, setScopeData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    sumTotalCO2Emission: 0,
    sumTotalCO2Intentsity: 0,
    sumTotalCO2Reduction: 0,
    latestUpdated: 0,
  });
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [sumAllTotalGHG, setSumAllTotalGHG] = useState(0);
  const [CO2Reduction, setCO2Reduction] = useState(0);
  const [totalIntensity, setTotalIntensity] = useState(0);
  const [sumAllTotalZoneHealth, setsumAllTotalZoneHealth] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { t } = useTranslation();

  const today = new Date();
  const currentFiscalYear =
    today.getMonth() + 1 >= 10 ? today.getFullYear() + 1 : today.getFullYear();

  // ปีปฏิทิน 2022 ถึง ปีปัจจุบัน
  const calendarYears = Array.from(
    { length: currentYear - 2021 },
    (_, i) => 2022 + i
  );

  // ปีงบประมาณ 2022 ถึง ปีงบปัจจุบัน
  const fiscalYears = Array.from(
    { length: currentFiscalYear - 2021 },
    (_, i) => 2022 + i
  );

  useEffect(() => {
    if (scopeData.length > 0) {
      process.setProgress();
    }
  }, [scopeData]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/master/all/province`
        );
        setProvinces(response.data.data || []);
      } catch (error) {
        console.error("Error fetching provinces:", error);
      }
    };

    fetchProvinces();
  }, []);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };

    setFilters(updatedFilters);

    // โหลดอำเภอใหม่ถ้าเลือกจังหวัด
    if (name === "provinceCode") {
      try {
        const response = await axios.get(
          `${BASE_URL}/master/all/district`,
          { params: { provinceCode: value } }
        );
        setDistricts(response.data.data || []);
        setFilters((prev) => ({ ...prev, districtCode: "", hospitalCode: "" }));
        setHospitals([]);
      } catch (error) {
        console.error("Error fetching districts:", error);
        setDistricts([]);
      }
    }

    // โหลดโรงพยาบาลใหม่ถ้าเลือกอำเภอ
    if (name === "districtCode") {
      try {
        const response = await axios.get(
          `${BASE_URL}/master/all/hospital`,
          {
            params: {
              districtCode: value,
              provinceCode: filters.provinceCode,
            },
          }
        );
        setHospitals(response.data.data || []);
        setFilters((prev) => ({ ...prev, hospitalCode: "" }));
      } catch (error) {
        console.error("Error fetching hospitals:", error);
        setHospitals([]);
      }
    }
    fetchData(updatedFilters);
  };

  const fetchData = async (queryFilters) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/dashboard/total/carbon`,
        {
          params: queryFilters,
        }
      );
      const {
        sumTotalCO2Emission,
        sumTotalCO2Intentsity,
        sumTotalCO2Reduction,
        latestUpdated,
      } = response.data.data;

      setSummaryData({
        sumTotalCO2Emission: sumTotalCO2Emission || 0,
        sumTotalCO2Intentsity: sumTotalCO2Intentsity || 0,
        sumTotalCO2Reduction: sumTotalCO2Reduction || 0,
        latestUpdated: latestUpdated || 0,
      });

      if (response.data?.data?.dataOfScope) {
        setScopeData(response.data.data.dataOfScope);
        process.setProgress();
      }
    } catch (error) {
      console.error("API Error:", error);
    }
  };

  useEffect(() => {
    // Fetch Data เฉพาะค่าปีเริ่มต้น
    fetchData({
      yearFilter: filters.yearFilter,
      yearFrom: filters.yearFrom,
      yearTo: filters.yearTo,
    });
  }, []); // ทำงานแค่ครั้งแรกตอนโหลดหน้า

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
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn("Token expired or invalid:", error.response.data.message);
        clearSession();
        setIsLoggedIn(false);
        message.warning("Session expired. Please login again.");
      }
    }
  };

  useEffect(() => {
    checkTokenValidity();
    setIsLoggedIn(!!getToken());
  }, []);

  const handleLoginClick = () => {
    navigate("/login-moph");
  };

  const handleLogoutClick = async () => {
    setIsLoading(true);
    const token = getToken();

    if (!token) {
      message.warning("No token found. Please login first.");
      setIsLoading(false);
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
      setIsLoggedIn(false);
      message.success("Logout successful!");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      message.error(
        error.response?.data?.message || "Logout failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (e) => {
    const selectedLang = e.target.value;
    i18n.changeLanguage(selectedLang);
  };

  const handleClick = () => {
    message.info("Coming Soon");
  };

  const dashboardRef = useRef(null);
  const scrollToDashboard = () => {
    if (dashboardRef.current) {
      dashboardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const footerRef = useRef(null);
  const scrollToFooter = () => {
    if (footerRef.current) {
      footerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const homeRef = useRef(null);
  const scrollToHome = () => {
    if (homeRef.current) {
      homeRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div>
      <AnnouncementBar />
      <div className="main-bg index-bg" ref={homeRef}>
        <div class="menu-toggle" id="show-menu-bar" onClick={()=> setIsMenuOpen(true)}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div
          className={`top-nav home ${isScrolled ? "scrolled" : ""} ${isMenuOpen ? "show" : ""}`}
          id="menu-bar"
        >
          <div class="close-menu" id="close-menu-bar" onClick={()=> setIsMenuOpen(false)}>
            <span></span>
            <span></span>
          </div>
          <div className="logo-box">
            <img className="moph-logo" src="/images/moph-logo.png" alt="" />
            <img className="hitap-logo" src="/images/hitap-logo.png" alt="" />
          </div>
          <div className="menu-box">
            <a
              href="/home"
              className="menu-item active"
              onClick={(e) => {
                e.preventDefault();
                scrollToHome();
              }}
              style={{ fontSize: "20px" }}
            >
              {t("home")}
            </a>
            <a
              href="/dashboard"
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                scrollToDashboard();
              }}
              style={{ fontSize: "20px" }}
            >
              {t("Dashboard")}
            </a>

            <a
              href="/aboutus"
              className="menu-item"
              onClick={(e) => {
                e.preventDefault();
                scrollToFooter();
              }}
              style={{ fontSize: "20px" }}
            >
              {t("AboutUs")}
            </a>
          </div>
          <div className="translate-box">
            {isLoggedIn ? (
              <button
                className="btn btn-theme-success btn-login"
                onClick={handleLogoutClick}
              >
                <img src="/images/icon/icon-account-white.png" alt="" />
                <span>{t("logout")}</span>
              </button>
            ) : (
              <button
                className="btn btn-theme-success btn-login"
                onClick={handleLoginClick}
              >
                <img src="/images/icon/icon-account-white.png" alt="" />
                <span>{t("login")}</span>
              </button>
            )}
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

        <div className="home-section">
          <div className="logo">
            <img src="/images/login-logo.png" alt="" />
          </div>
          <div className="building">
            <img src="/images/building.png" alt="" />
          </div>
        </div>
        <div className="our-services">
          <p className="our-services-title">{t("our services")}</p>
          <div className="our-services-card-lists">
            {/* Card 1 */}
            <div className="card-wrapper" onClick={() => {
                if (isLoggedIn) {
                  navigate("/emissions-record");
                } else {
                  message.warning(t("Please login first!"));
                  navigate("/login-moph");
                }
              }}
              style={{ cursor: "pointer" }}
              >
              <div className="card-item" >
                <div className="card-top" style={{background: "#BA9A5E"}}>
                  <img src="/images/card-emissions-assessment1.png" alt="icon" style={{marginTop: "58px"}}/>
                </div>
                <div className="card-bottom">
                  <h4>
                    <Trans i18nKey="card_emissions_assessment" />
                  </h4>
                </div>
              </div>
              <img
                src="/images/icon/icon-arrow-card-home.png"
                alt="arrow"
                className="arrow-icon"
              />
            </div>
            {/* Card 2 */}
            <div className="card-wrapper" onClick={handleClick} style={{ cursor: "pointer" }}>
              <div className="card-item">
                <div className="card-top" style={{background: "#09616D"}}>
                  <img src="/images/card-missions-performance1.png" alt="icon" style={{width:"160px"}} />
                </div>
                <div className="card-bottom">
                  <h4>
                    <Trans i18nKey="card_missions-performance" />
                  </h4>
                </div>
              </div>
              <img
                src="/images/icon/icon-arrow-card-home.png"
                alt="arrow"
                className="arrow-icon"
              />
            </div>
            {/* Card 3 */}
            <div className="card-wrapper" onClick={handleClick} style={{ cursor: "pointer" }}>
              <div className="card-item">
                <div className="card-top" style={{background: "#195E7C"}}>
                  <img src="/images/card-carbon-quest1.png" alt="icon" />
                </div>
                <div className="card-bottom">
                  <h4>{t("CARBON QUEST")}</h4>
                  
                </div>
              </div>
              <img
                src="/images/icon/icon-arrow-card-home.png"
                alt="arrow"
                className="arrow-icon"
              />
            </div>
            {/* Card 4 */}
            <div className="card-wrapper" onClick={handleClick} style={{ cursor: "pointer" }}>
              <div className="card-item">
                <div className="card-top" style={{background: "#618F74"}}>
                  <img src="/images/card-publication-and-tools1.png" alt="icon" />
                </div>
                <div className="card-bottom">
                  <h4>
                    <Trans i18nKey="card-publication-and-tools" />
                  </h4>
                </div>
              </div>
              <img
                src="/images/icon/icon-arrow-card-home.png"
                alt="arrow"
                className="arrow-icon"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="dashboard-section" ref={dashboardRef}>
        <div className="dashboard-container">
          <div className="dashboard-title-box">
            <p>{t("Emissions Dashboard")}</p>
          </div>
          <div className="dashboard-content-container">
            <div className="summary-box">
              <div className="total-box">
                <img
                  className="thems-logo"
                  src="/images/THEMS_logo.png"
                  alt=""
                  style={{ width: "100px" }}
                />
                <div className="total-text">
                  <Trans
                    i18nKey="totalCO₂"
                    components={{ br: <br />, span: <span />, sub: <sub /> }}
                  />
                  <span className="update">
                    <img
                      width="12px"
                      src="/images/icon/icon-clock.png"
                      alt=""
                    />
                    {summaryData.latestUpdated}
                  </span>
                </div>
              </div>
              <div className="summary-row">
                <div className="summary-column column-emission">
                  <div className="title-label">
                    <Trans
                      i18nKey="CO₂Emission"
                      components={{
                        br: <br />,
                        span: <span style={{ color: "white" }} />,
                      }}
                    />
                  </div>
                  <div className="summary">
                    <p className="total">
                      {(summaryData?.sumTotalCO2Emission ?? 0).toLocaleString()}
                    </p>
                    <p className="unit">{"TCO₂eq"}</p>
                  </div>
                </div>
                <img
                  className="double-arrow"
                  src="/images/double-arrow.png"
                  alt=""
                />
                <div className="summary-column column-intentsity">
                  <div className="title-label">
                    <Trans
                      i18nKey="CO₂Intensity"
                      components={{
                        br: <br />,
                        span: <span style={{ color: "white", whiteSpace: "nowrap" }} />,
                      }}
                    />
                  </div>
                  <div className="summary">
                    <p className="total">
                      {(summaryData?.sumTotalCO2Intentsity ?? 0).toLocaleString(undefined, {
                        minimumFractionDigits: 5,
                        maximumFractionDigits: 5,
                      })}
                    </p>
                    <p className="unit">{"TCO2eq/visit"}</p>
                  </div>
                </div>
                <div className="summary-column column-reduction">
                  <img src="/images/seedling.png" className="seeding" alt="" />
                  <div className="title-label">
                    <Trans
                      i18nKey="CO₂Reduction"
                      components={{
                        br: <br />,
                        span: <span style={{ color: "white" }} />,
                      }}
                    />
                  </div>
                  <div className="summary">
                    <p className="total">
                      {/* {(
                        summaryData?.sumTotalCO2Reduction ?? 0
                      ).toLocaleString()} */}
                      {(summaryData?.sumTotalCO2Reduction ?? 0).toLocaleString(undefined, {
                        minimumFractionDigits: 5,
                        maximumFractionDigits: 5,
                      })}
                    </p>
                    <p className="unit">{"TCO₂eq"}</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Dropdown & Date Picker Filters */}
            <div
              className="filter-container"
              style={{
                display: "flex",
                gap: "25px",
                justifyContent: "center",
                marginTop: "150px",
                 flexWrap: "wrap",
              }}
            >
              {/* Year Filter */}
              <select
                name="yearFilter"
                className="input-theme-select"
                value={filters.yearFilter}
                onChange={handleChange}
              >
                <option value="calendar">{t("Calendar year")}</option>
                <option value="budget">{t("Fiscal year")}</option>
              </select>

              {/* Year From */}
                  <select
                    name="yearFrom"
                    className="input-theme-select"
                    value={filters.yearFrom}
                    onChange={handleChange}
                  >
                    {(filters.yearFilter === "budget"
                      ? fiscalYears
                      : calendarYears
                    ).map((year) => (
                      <option key={year} value={year}>
                        {t("Year")} {year}
                      </option>
                    ))}
                  </select>

                  {/* Year To */}
                  <select
                    name="yearTo"
                    className="input-theme-select"
                    value={filters.yearTo}
                    onChange={handleChange}
                  >
                    {(filters.yearFilter === "budget"
                      ? fiscalYears
                      : calendarYears
                    ).map((year) => (
                      <option key={year} value={year}>
                        {t("to")} {year}
                      </option>
                    ))}
                  </select>

              {/* Select Province */}
              <select
                name="provinceCode"
                className="input-theme-select"
                value={filters.provinceCode}
                onChange={handleChange}
              >
                <option value="">{t("All Provinces")}</option>
                {provinces.map((province) => (
                  <option
                    key={province.provinceCode}
                    value={province.provinceCode}
                  >
                    {province.nameTH}
                  </option>
                ))}
              </select>

              {/* Select District */}
              {/* <select
                name="districtCode"
                className="input-theme-select"
                value={filters.districtCode}
                onChange={handleChange}
                disabled={!filters.provinceCode}
              >
                <option value="">{t("All Districts")}</option>
                {districts.map((district) => (
                  <option
                    key={district.districtCode}
                    value={district.districtCode}
                  >
                    {district.nameTH}
                  </option>
                ))}
              </select> */}

              {/* Select Hospital */}
              {/* <select
                name="hospitalCode"
                className="input-theme-select"
                value={filters.hospitalCode}
                onChange={handleChange}
                disabled={!filters.districtCode}
              >
                <option value="">{t("All Hospitals")}</option>
                {hospitals.map((hospital) => (
                  <option
                    key={hospital.hospitalCode}
                    value={hospital.hospitalCode}
                  >
                    {hospital.nameTH}
                  </option>
                ))}
              </select> */}
            </div>
            <div className="scope-card-row">
              <div className="scope-col">
                <div className="scope-card">
                  <div
                    className="card-process circleProcess"
                    data-percent={scopeData[0]?.percentOfScope}
                  >
                    <div className="circleProcess__percent">
                      <div className="halfCirlce"></div>
                    </div>
                    <div className="circleProcess__percent">
                      <div className="halfCirlce"></div>
                    </div>
                    <div className="circleProcess__Content">
                      <div className="circleProcess__ContentBox">
                        <p className="total">total ghg</p>
                        <p className="percent">
                          {scopeData[0]?.percentOfScope}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <img className="card-img" src="/images/card-1.png" alt="" />
                  <p className="scope">{t("scope 1")}</p>
                  <p className="title">{t("direct emission")}</p>
                  <p className="sub-title">
                    <Trans
                      i18nKey="Emissions_from_sources_(On site)"
                      components={{ br: <br /> }}
                    />
                  </p>
                  <img className="arrow" src="/images/card-arrow.png" alt="" />
                </div>
              </div>
              <div className="scope-col">
                <div className="scope-card">
                  <div
                    className="card-process circleProcess"
                    data-percent={scopeData[1]?.percentOfScope}
                  >
                    <div className="circleProcess__percent">
                      <div className="halfCirlce"></div>
                    </div>
                    <div className="circleProcess__percent">
                      <div className="halfCirlce"></div>
                    </div>
                    <div className="circleProcess__Content">
                      <div className="circleProcess__ContentBox">
                        <p className="total">total ghg</p>
                        <p className="percent">
                          {scopeData[1]?.percentOfScope}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <img className="card-img" src="/images/card-2.png" alt="" />
                  <p className="scope">{t("scope 2")}</p>
                  <p className="title">{t("indirect emission")}</p>
                  <p className="sub-title">
                    <Trans
                      i18nKey="Emissions_from_energy_utilities"
                      components={{ br: <br /> }}
                    />
                  </p>
                  <img className="arrow" src="/images/card-arrow.png" alt="" />
                </div>
              </div>
              <div className="scope-col">
                <div className="scope-card">
                  <div
                    className="card-process circleProcess"
                    data-percent={scopeData[2]?.percentOfScope}
                  >
                    <div className="circleProcess__percent">
                      <div className="halfCirlce"></div>
                    </div>
                    <div className="circleProcess__percent">
                      <div className="halfCirlce"></div>
                    </div>
                    <div className="circleProcess__Content">
                      <div className="circleProcess__ContentBox">
                        <p className="total">total ghg</p>
                        <p className="percent">
                          {scopeData[2]?.percentOfScope}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <img className="card-img" src="/images/card-3.png" alt="" />
                  <p className="scope">{t("scope 3")}</p>
                  <p className="title">{t("other indirect emission")}</p>
                  <p className="sub-title">
                    <Trans
                      i18nKey="Emissions_of_the_chain_supply_or_service"
                      components={{ br: <br /> }}
                    />
                  </p>
                  <img className="arrow" src="/images/card-arrow.png" alt="" />
                </div>
              </div>
              <div className="scope-col">
                <div className="scope-card">
                  <div
                    className="card-process circleProcess"
                    data-percent={scopeData[3]?.percentOfScope}
                  >
                    <div className="circleProcess__percent">
                      <div className="halfCirlce"></div>
                    </div>
                    <div className="circleProcess__percent">
                      <div className="halfCirlce"></div>
                    </div>
                    <div className="circleProcess__Content">
                      <div className="circleProcess__ContentBox">
                        <p className="total">total ghg</p>
                        <p className="percent">
                          {scopeData[3]?.percentOfScope}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <img className="card-img" src="/images/card-4.png" alt="" />
                  <p className="scope">{t("Other Scope")}</p>
                  <p className="title">{t("non protocol")}</p>
                  <p className="sub-title">
                    <Trans
                      i18nKey="Emissions_from_patient_commute"
                      components={{ br: <br /> }}
                    />
                  </p>
                  <img className="arrow" src="/images/card-arrow.png" alt="" />
                </div>
              </div>
            </div>
            <div className="chart-dash-container">
              <div className="row mb-3">
                <div className="col-12 col-xxl-5 mb-3 mb-xxl-0">
                  <div className="chart-card">
                    <div className="chart-header">
                      <div className="chart-label">
                        {t("Annual CO₂ emission")}
                      </div>
                    </div>
                    <div className="chart-body">
                      <GraphAnnualEmission filters={filters} />
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6 col-xxl-4 mb-3 mb-md-0">
                  <div className="chart-card">
                    <div className="chart-header">
                      <div className="chart-label">
                        <Trans
                          i18nKey="Emissios_AreaHealth"
                          components={{ br: <br /> }}
                        />
                      </div>
                      <div className="chart-summary">
                        <p className="total">
                          {(sumAllTotalZoneHealth ?? 0).toLocaleString()}
                        </p>
                        <p className="unit">{t("TCO₂eq")}</p>
                      </div>
                    </div>
                    <div className="chart-body">
                      <GraphZoneHealth
                        filters={filters}
                        language={i18n.language}
                        onDataLoaded={(data) => setsumAllTotalZoneHealth(data)}
                      />
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6 col-xxl-3">
                  <div className="chart-card">
                    <div className="chart-header">
                      <div className="chart-label">
                        <Trans
                          i18nKey="Intensity_Allscope"
                          components={{ br: <br /> }}
                        />
                      </div>
                      <div className="chart-summary">
                        <p className="total">{totalIntensity ?? 0}</p>
                        <p className="unit">{t("TCO2eq/visit")}</p>
                      </div>
                    </div>
                    <div className="chart-body">
                      <GraphIntensity
                        filters={filters}
                        onDataLoaded={(data) => setTotalIntensity(data)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-12 col-xl-8 mb-3 mb-xl-0">
                  <div className="chart-card">
                    <div className="chart-header">
                      <div className="chart-label">
                        <Trans
                          i18nKey="carbon_footprint"
                          components={{ br: <br /> }}
                        />
                      </div>
                      <div className="chart-summary">
                        <p className="total">
                          {(sumAllTotalGHG ?? 0).toLocaleString()}
                        </p>
                        <p className="unit">{t("TCO₂eq")}</p>
                      </div>
                    </div>
                    <div className="chart-body">
                      <GrapDashboard
                        filters={filters}
                        language={i18n.language}
                        onDataLoaded={(data) => setSumAllTotalGHG(data)}
                      />
                    </div>
                  </div>
                </div>
                <div className="col-12 col-xl-4">
                  <GraphReduction
                    filters={filters}
                    onDataLoaded={setCO2Reduction}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <footer ref={footerRef}>
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
          <p className="footer">
            Copyright © by Ministry of Public Health 2025
          </p>
        </footer>
      </div>
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

export default HomeMoph;
