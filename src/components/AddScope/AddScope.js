/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { Input, message, Modal, Select } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import localstorageData from "../localstorageData";
import process from "../process";
import checkResponse from "../checkResponse";
import GrapScope from "../graphScope";
import GrapScopeTwo from "../graphScopeTwo";
import { useTranslation } from "react-i18next";
import BASE_URL from "../../config/apiConfig";
import MenuPage from "../Menu/MenuPage";

const { Option } = Select;

const EditableDropdownInput = ({
  value = "",
  onChange,
  disabled,
  id,
  column,
  handleCellBlur,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleInputBlur = () => {
    handleCellBlur(value, id, column);
    setIsEditing(false);
  };

  const handleSelectChange = (newValue) => {
    if (!disabled) {
      onChange(newValue ?? "");
      handleCellBlur(newValue, id, column);
      setIsEditing(false);
    }
  };

  const formatNumber = (val) => {
    if (val === "") return "";
    const parts = val.toString().split(".");
    const intPart = Number(parts[0]).toLocaleString();
    return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
  };
  

  return (
    <div onDoubleClick={() => !disabled && setIsEditing(true)}>
      {isEditing ? (
        <Select
          value={value ?? ""}
          onChange={handleSelectChange}
          onBlur={() => setIsEditing(false)}
          style={{ width: "100%" }}
          disabled={disabled}
          autoFocus
        >
          <Option value="">Select</Option>
          <Option value="Not Occurring">Not Occurring</Option>
          <Option value="Data not available">Data not available</Option>
        </Select>
      ) : (
        <Input
        value={
          value !== "" && !isNaN(Number(value))
            ? formatNumber(value)
            : value ?? ""
        }
        onChange={(e) => {
          if (!disabled) {
            const raw = e.target.value.replace(/,/g, "");
            // ตรวจเฉพาะค่าที่เป็นตัวเลข หรือมีทศนิยม
            if (/^\d*\.?\d*$/.test(raw)) {
              onChange(raw);
            }
          }
        }}
        onBlur={handleInputBlur}
        disabled={disabled}
      />
      

      )}
    </div>
  );
};

const AddScope = ({ scopeID }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const roleID = Number(localStorage.getItem("roleID") || 0);
  const hospitalCode = localStorage.getItem("hospitalCode");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    totalCO2Emission: 0,
    totalCO2Intentsity: 0,
    totalCO2Reduction: 0,
  });
  const [months, setMonths] = useState([]);
  const [emissionData, setEmissionData] = useState({
    quarterInputID: null,
    quarterBudgetID: null,
    statusID: null,
    year: null,
  });
  const [isDisabled, setIsDisabled] = useState(false);
  const [scopePercentages, setScopePercentages] = useState({});
  const [graphType, setGraphType] = useState("year");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [graphView, setGraphView] = useState("summary");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const scopekey = `scope_${scopeID}`;
  const isTH = (i18n.language || "").toLowerCase().startsWith("th");


  useEffect(() => {
    const storedScopeData =
      JSON.parse(localStorage.getItem("scopePercentages")) || {};
    const storedEmissionData = JSON.parse(localStorage.getItem("emissionData"));
    setScopePercentages(storedScopeData);

    if (storedEmissionData) {
      setEmissionData((prev) => ({ ...prev, ...storedEmissionData }));

      if (storedEmissionData?.statusID === 3) {
        setIsDisabled(true);
        setIsSubmitted(true);
      }
    } else {
      console.warn("⚠️ No emission data found in Local Storage.");
    }
  }, []);

  useEffect(() => {
    const storedSummary = JSON.parse(localStorage.getItem("summaryData"));
    if (storedSummary) {
      setSummaryData(storedSummary);
    }
  }, []);

  useEffect(() => {
    const storedRecords = JSON.parse(localStorage.getItem(scopekey)) || [];
    if (storedRecords.length > 0) {
      setRecords(storedRecords);
    }
  }, [scopeID]);

  useEffect(() => {
    const fetchDataAsync = async () => {
      if (emissionData?.quarterInputID) {
        setLoading(true);
        try {
          if (!localstorageData.getEditActivityStatus()) {
            const storedRecords =
              JSON.parse(localStorage.getItem(scopekey)) || [];
            if (storedRecords.length > 0) {
              setRecords(storedRecords);
            } else {
              await fetchData();
            }
          } else {
            await localDataScope();
          }
        } catch (error) {
          console.error("❌ Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDataAsync();
  }, [emissionData.quarterInputID, currentLang, scopeID]);

  useEffect(() => {
    const storedMonths = localStorage.getItem("months");
  
    if (storedMonths) {
      setMonths(JSON.parse(storedMonths));
    }
  }, []);  

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

  const queryParams = {
    quarterInputID: emissionData.quarterInputID,
    hospitalCode: hospitalCode,
  };

  const scopeImages = {
    1: "/images/scope-1.png",
    2: "/images/scope-2.png",
    3: "/images/scope-3.png",
    4: "/images/scope-4.png",
    5: "/images/scope-5.png"
  };

  // const scopeImage = scopeID !== 5 ? scopeImages[scopeID] || "/images/default-scope.png" : null;
  const scopeImage = scopeImages[scopeID] || "/images/default-scope.png";


  const localDataScope = async () => {
    try {
      const localScopeData = JSON.parse(localStorage.getItem(scopekey)) || [];
      setRecords(localScopeData);

      if (!localScopeData.length) {
        console.warn(`⚠️ No data found for scope_${scopeID} in localStorage.`);
        return;
      }

      const monthID = {
        jan: 1,
        feb: 2,
        mar: 3,
        apr: 4,
        may: 5,
        jun: 6,
        jul: 7,
        aug: 8,
        sep: 9,
        oct: 10,
        nov: 11,
        dec: 12,
      };

      const mathMonths = Object.keys(localScopeData[0] || {})
        .filter((key) => Object.keys(monthID).includes(key))
        .sort((a, b) => monthID[a] - monthID[b]);

      const months = mathMonths.map((month) => ({
        id: monthID[month],
        name: month,
      }));
      setMonths(months);
    } catch (error) {
      console.error("❌ Error fetching local scope data:", error);
      message.error("Failed to fetch local storage data.");
      message.error(isTH ? "ดึงข้อมูลจาก Local Storage ไม่สำเร็จ" : "Failed to fetch local storage data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/activity/history`,
        {
          params: queryParams,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.statusCode === 200) {
        const responseData = response.data.data;

        if (!responseData) {
          console.warn("⚠️ No data received from API.");
          return;
        }

        // เก็บ Scope Percentages ลง localStorage
        const scopeData = {};
        responseData.activityList.forEach((scope) => {
          scopeData[scope.scopeID] = scope.percentOfData;
        });
        setScopePercentages(scopeData);
        localStorage.setItem("scopePercentages", JSON.stringify(scopeData));
        process.setProgress();

        // เก็บ Emission Data ลง localStorage
        const newEmissionData = {
          quarterInputID: emissionData.quarterInputID,
          quarterBudgetID: emissionData.quarterBudgetID,
          historyID: responseData.historyID ?? 0,
          activityData: responseData.activityList ?? [],
          statusID: responseData.statusID,
          year: emissionData.year,
        };
        setEmissionData(newEmissionData);
        localStorage.setItem("emissionData", JSON.stringify(newEmissionData));

        // ใช้ข้อมูลเดือนแบบ Array
        const dynamicMonths =
          responseData.periodsMonth?.map((month) => ({
            id: month?.monthID ?? 0,
            name: month?.monthNameEN?.toLowerCase() ?? "",
          })) ?? [];
        setMonths(dynamicMonths);
        localStorage.setItem("months", JSON.stringify(dynamicMonths));

        const activityList = responseData.activityList ?? [];
        const allScopes = activityList.reduce((acc, scope) => {
          const scopeID = scope.scopeID ?? 0;
          const scopeActivities = scope.activityList.map((activity) => {
            // สร้าง `mainRecord`
            const mainRecord = {
              id: activity.groupID,
              groupID: activity.groupID,
              nameEN: activity.groupDescriptionEN,
              nameTH: activity.groupDescriptionTH,
              unitEN: activity.unitEN,
              unitTH: activity.unitTH,
              inputType: activity.inputType ?? 0,
              estimatedAnnualResourceUseTotal:
                activity.estimatedAnnualResourceUseTotal ?? 0,
              GHGValue: activity.GHGValue ?? 0,
              GHGPerActivityTotal: activity.GHGPerActivityTotal ?? 0,
            };

            // เติมค่าจาก activityValue เข้าไปให้ตรงกับเดือน
            activity.activityValue.forEach((value) => {
              const monthKey = dynamicMonths.find(
                (m) => m.id === value.monthID
              )?.name;
              if (monthKey) {
                mainRecord[monthKey] = value.value ?? "";
                mainRecord[`${monthKey}_recordID`] = value.recordID ?? null
              }
            });

            // สร้าง `subGroupRecords` และเพิ่ม activityValue เข้าไปให้ถูกต้อง
            const subGroupRecords = (activity.subGroupList ?? []).map(
              (sub, subIndex) => {
                const subRecord = {
                  id: `${activity.groupID}.${subIndex + 1}`,
                  subGroupID: sub.subGroupID,
                  nameEN: sub.subGroupDescriptionEN,
                  nameTH: sub.subGroupDescriptionTH,
                  unitEN: sub.unitEN,
                  unitTH: sub.unitTH,
                  inputType: sub.inputType ?? 0,
                  estimatedAnnualResourceUseTotal:
                    sub.estimatedAnnualResourceUseTotal ?? 0,
                  GHGValue: sub.GHGValue ?? 0,
                  GHGPerActivityTotal: sub.GHGPerActivityTotal ?? 0,
                };

                // เติมค่าจาก `activityValue` ของ `subGroup`
                sub.activityValue?.forEach((value) => {
                  const monthKey = dynamicMonths.find(
                    (m) => m.id === value.monthID
                  )?.name;
                  if (monthKey) {
                    subRecord[monthKey] = value.value ?? "";
                    subRecord[`${monthKey}_recordID`] = value.recordID ?? null
                  }
                });

                return subRecord;
              }
            );

            return [mainRecord, ...subGroupRecords];
          });

          acc[scopeID] = scopeActivities.flat(); // ให้รวม SubGroup ด้วย
          return acc;
        }, {});

        // บันทึกทุก Scope (1-5) ลง localStorage
        for (let i = 1; i <= 5; i++) {
          localStorage.setItem(
            `scope_${i}`,
            JSON.stringify(allScopes[i] || [])
          );
        }

        // แสดงข้อมูลของ Scope ปัจจุบัน (scopeID)
        setRecords(allScopes[scopeID] || []);

        // ใช้ค่าของ `scopeID` เพื่ออัปเดต Summary
        const scopeSummary = responseData.activityList.find(
          (s) => s.scopeID === scopeID
        );

        const updatedSummary = {
          totalCO2Emission:
            scopeSummary?.totalCO2Emission ??
            responseData.totalCO2Emission ??
            0,
          totalCO2Intentsity:
            scopeSummary?.totalCO2Intentsity ??
            responseData.totalCO2Intentsity ??
            0,
          totalCO2Reduction:
            scopeSummary?.totalCO2Reduction ??
            responseData.totalCO2Reduction ??
            0,
        };
        setSummaryData(updatedSummary);
        localStorage.setItem("summaryData", JSON.stringify(updatedSummary));
      }
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      message.error( isTH ? "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง" : "Failed to load data. Please try again.");
      checkResponse.checkResponseApi(error, navigate);
    } finally {
      setLoading(false);
    }
  };

  const handleCellBlur = (value, id, column) => {
    let updatedRecords = records.map((record) => ({ ...record })); // สร้าง `updatedRecords` ก่อน

    if (id === "21.1" && value !== "") {
      // ล้างค่าของเดือนนั้นๆ ใน 21.2
      updatedRecords = updatedRecords.map((record) =>
        record.id === "21.2" ? { ...record, [column]: "" } : record
      );
    } else if (id === "21.2" && value !== "") {
      // ล้างค่าของเดือนนั้นๆ ใน 21.1
      updatedRecords = updatedRecords.map((record) =>
        record.id === "21.1" ? { ...record, [column]: "" } : record
      );
    }

    // อัปเดตค่าใหม่ของ input ที่กรอก
    updatedRecords = updatedRecords.map((record) =>
      record.id === id ? { ...record, [column]: value ?? "" } : record
    );

    // อัปเดต state
    setRecords(updatedRecords);

    // บันทึกข้อมูลของ Scope ปัจจุบันลง localStorage
    localStorage.setItem(scopekey, JSON.stringify(updatedRecords));
  };

  const handleSave = async (status) => {
    if (!token) {
      message.warning("No token found. Please login first.");
      return;
    }

    const quarterInputID = Number(emissionData.quarterInputID) || null;

    // เก็บข้อมูล Scope ปัจจุบันลง localStorage ก่อน
    localStorage.setItem(`scope_${scopeID}`, JSON.stringify(records));

    // โหลดข้อมูลของทุก Scope (1-5)
    const allScopesRecords = Array.from({ length: 5 }, (_, i) => i + 1).flatMap(
      (id) =>
        (JSON.parse(localStorage.getItem(`scope_${id}`)) || []).map(
          (record) => ({
            ...record,
            scopeID: id, // ใส่ scopeID ที่ถูกต้อง
          })
        )
    );

    // แปลงข้อมูลให้ตรงกับ API
    const activityData = allScopesRecords.map((record) => ({
      scopeID: record.scopeID,
      groupID: record.id ? parseInt(String(record.id).split(".")[0], 10) : null,
      subGroupID:
        record.subGroupID && record.subGroupID !== 0 ? record.subGroupID : null,
      data: months.map((month) => ({
        monthID: month.id,
        value: record[month.name] || "",
      })),
    }));

    const body = {
      hospitalCode,
      quarterInputID,
      status,
      activityData,
    };

    setLoadingSave(true);

    try {
      const response = await axios.post(
        `${BASE_URL}/activity/history`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response?.data?.statusCode === 200) {
        const responseData = response.data.data;

        // อัปเดต Scope Percentages
        setScopePercentages((prev) => {
          const updatedScopeData = { ...prev };
          responseData.activityList.forEach((scope) => {
            updatedScopeData[scope.scopeID] = scope.percentOfData;
          });
          localStorage.setItem(
            "scopePercentages",
            JSON.stringify(updatedScopeData)
          );
          return updatedScopeData;
        });

        process.setProgress();

        // อัปเดต Emission Data
        const existingEmissionData =
          JSON.parse(localStorage.getItem("emissionData")) || {};
        const updatedEmissionData = {
          ...existingEmissionData,
          historyID: responseData.historyID ?? 0,
          statusID: responseData.statusID,
        };
        localStorage.setItem(
          "emissionData",
          JSON.stringify(updatedEmissionData)
        );
        setEmissionData(updatedEmissionData);

        // อัปเดต Summary Data (รวมทุก Scope)
        const updatedSummaryData = {
          totalCO2Emission: responseData.totalCO2Emission ?? 0,
          totalCO2Intentsity: responseData.totalCO2Intentsity ?? 0,
          totalCO2Reduction: responseData.totalCO2Reduction ?? 0,
        };
        setSummaryData(updatedSummaryData);
        localStorage.setItem("summaryData", JSON.stringify(updatedSummaryData));

        await fetchData();
        // message.success("Saved successfully!");
        localstorageData.setEditActivityStatus(false);
      } else {
        throw new Error(response?.data?.message || "Unexpected response");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      message.error(
  error?.response?.data?.message ||
    (isTH
      ? "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
      : "Failed to save data. Please try again.")
);
    } finally {
      setLoadingSave(false);
    }
  };

  const handleUpdate = async (status) => {
    if (!token) {
     message.warning(
  isTH
    ? "ไม่พบ Token กรุณาเข้าสู่ระบบอีกครั้ง"
    : "No token found. Please login first."
);
      return;
    }

    const emission = JSON.parse(localStorage.getItem("emissionData"));

    const historyID = Number(emission?.historyID) || null;
    if (!historyID) {
      message.error(
  isTH
    ? "ไม่พบ historyID กรุณาบันทึกข้อมูลก่อน"
    : "No historyID found. Please save data first."
);
      return;
    }

    // ใช้ scopeID จาก props เพื่อดึงข้อมูลของ Scope ปัจจุบัน
    const currentScopeRecords =
      JSON.parse(localStorage.getItem(scopekey)) || [];

    // โหลดข้อมูลของ Scope 1-5 (ไม่ต้องกำหนดทีละตัว)
    const otherScopesRecords = Array.from({ length: 5 }, (_, i) => i + 1)
      .filter((id) => id !== scopeID) // ข้าม scope ปัจจุบัน
      .flatMap((id) =>
        (JSON.parse(localStorage.getItem(`scope_${id}`)) || []).map(
          (record) => ({
            ...record,
            scopeID: id, // ใช้ `id` ที่ถูกต้อง
          })
        )
      );

    // รวมข้อมูลทั้งหมดของ scope ปัจจุบัน + scope อื่นๆ
    const allScopesRecords = [
      ...currentScopeRecords.map((record) => ({ ...record, scopeID })),
      ...otherScopesRecords,
    ];

    // แปลงข้อมูลให้ตรงกับ API
    const updatedActivityData = allScopesRecords.map((record) => ({
      scopeID: record.scopeID,
      groupID: record.id ? parseInt(String(record.id).split(".")[0], 10) : null,
      subGroupID:
        record.subGroupID && record.subGroupID !== 0 ? record.subGroupID : null,
      data: months.map((month) => ({
        monthID: month.id,
        value: record[month.name] ?? "",
        recordID: record[`${month.name}_recordID`] ?? null,
      })),
    }));

    const body = {
      hospitalCode,
      historyID,
      status,
      activityData: updatedActivityData,
    };

    setLoadingSave(true);

    try {
      const response = await axios.put(
        `${BASE_URL}/activity/history`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response?.data?.statusCode === 200) {
        const responseData = response.data.data;

        // อัปเดต Scope Percentages
        setScopePercentages((prev) => {
          const updatedScopeData = { ...prev };
          responseData.activityList.forEach((scope) => {
            updatedScopeData[scope.scopeID] = scope.percentOfData;
          });
          localStorage.setItem(
            "scopePercentages",
            JSON.stringify(updatedScopeData)
          );
          return updatedScopeData;
        });

        process.setProgress();

        // อัปเดต Emission Data
        const existingEmissionData =
          JSON.parse(localStorage.getItem("emissionData")) || {};
        const updatedEmissionData = {
          ...existingEmissionData,
          historyID: responseData.historyID ?? 0,
          statusID: responseData.statusID,
        };
        localStorage.setItem(
          "emissionData",
          JSON.stringify(updatedEmissionData)
        );
        setEmissionData(updatedEmissionData);

        // อัปเดต Summary Data เฉพาะ Scope ปัจจุบัน
        const scopeSummary =
          responseData.activityList.find((s) => s.scopeID === scopeID) || {};

        setSummaryData({
          totalCO2Emission: scopeSummary.totalCO2Emission ?? 0,
          totalCO2Intentsity: scopeSummary.totalCO2Intentsity ?? 0,
          totalCO2Reduction: scopeSummary.totalCO2Reduction ?? 0,
        });
        localStorage.setItem("summaryData", JSON.stringify(scopeSummary));

        // เซฟข้อมูล Scope ปัจจุบันใน Local Storage
        localStorage.setItem(scopekey, JSON.stringify(currentScopeRecords));

        await fetchData();
        // message.success("Saved successfully!");
        localstorageData.setEditActivityStatus(false);
      } else {
        throw new Error(response?.data?.message || "Unexpected response");
      }
    } catch (error) {
      console.error("❌ Error updating data:", error);
      message.error(
  error?.response?.data?.message ||
    (isTH
      ? "อัปเดตข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
      : "Failed to update data. Please try again.")
);
    } finally {
      setLoadingSave(false);
    }
  };

  const isField30_1Complete = () => {
    const scope4Records = JSON.parse(localStorage.getItem("scope_4")) || [];
    const record29_1 = scope4Records.find((record) => record.id === "30.1");
    if (!record29_1) return false;
  
    return months.every(
      (month) => record29_1[month.name] && record29_1[month.name].trim() !== ""
    );
  };
  

  const handleSaveOrUpdate = async (type) => {

    if (type === "submit" && !isField30_1Complete() ) {
      message.error(
        t("activity30_1_required")
      );
      return;
    }

    const status = type === "save" ? 2 : 3;
    const emission = JSON.parse(localStorage.getItem("emissionData")) || {};

    try {
      if (emission?.historyID) {
        await handleUpdate(status);
      } else {
        await handleSave(status);
      }

      if (status === 3) {
        setIsDisabled(true);
        setIsSubmitted(true);
        message.success(t("Submitted successfully!"));
      } else {
        message.success(t("Saved successfully!"));
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error in handleSaveOrUpdate:", error);
      message.error(
  isTH
    ? "บันทึกหรืออัปเดตข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
    : "Failed to save or update. Please try again."
);
    }
  };

  const handleLogoutClick = async () => {
  if (isLoggingOut) {
    message.warning(
  isTH
    ? "กำลังออกจากระบบ... กรุณารอสักครู่"
    : "Logging out... Please wait."
);
    return;
  }

  const token = localStorage.getItem("token");
  const hospitalCode = localStorage.getItem("hospitalCode");
  const quarterInputID = localStorage.getItem("quarterInputID");

  if (!token) {
   message.warning(
  isTH
    ? "ไม่พบ Token กรุณาเข้าสู่ระบบก่อน"
    : "No token found. Please login first."
);
    return;
  }

  try {
    setIsLoggingOut(true);

    // ลบ session ก่อน logout
    if (hospitalCode && quarterInputID) {
      try {
        await axios.delete(
          `${BASE_URL}/staff/auth/session/${hospitalCode}/${quarterInputID}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err) {
        console.warn("Failed to delete session before logout:", err);
      }
    }

    // ดำเนินการ logout ปกติ
    const response = await axios.post(
      `${BASE_URL}/staff/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response?.data?.statusCode === 200) {
      message.success("Logout successful!");
    } else {
      throw new Error(response?.data?.message || "Logout failed.");
    }
  } catch (error) {
    console.error("Error during logout:", error);
    message.error(
      error?.response?.data?.message || "Logout failed. Please try again."
    );
  } finally {
    // 🧹 เคลียร์ทุกอย่างหลัง logout
    localStorage.clear();
    navigate("/");
    setIsLoggingOut(false);
  }
};


  const showConfirmModal = () => {
    if (!isField30_1Complete()) {
      message.error(
       t("activity30_1_required")
      );
      return;
    }
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
    handleSaveOrUpdate("submit");
  };

  const handleCancel = () => {
    setIsModalVisible(false);
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
        {loadingSave && (
          <div className="loading-overlay">
            <div className="loading-content">
              <p>{t("⏳ Saving data... Please wait.")}</p>
            </div>
          </div>
        )}
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
                    onClick={() => navigate("/add-scope/1")}
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
                    onClick={() => navigate("/add-scope/2")}
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
                    onClick={() => navigate("/add-scope/3")}
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
                    onClick={() => navigate("/add-scope/4")}
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
                    onClick={() => navigate("/add-scope/5")}
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
                        isSubmitted
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
              <div className="summary-container">
                <div className="summary-column column-emission">
                  <div className="title-label">
                    <span>{t("Total CO₂ Emission")}</span>
                  </div>
                  <div className="summary">
                    <p className="total">
                      {summaryData?.totalCO2Emission?.toLocaleString() ?? "0"}
                    </p>
                    <p className="unit">{"TCO₂eq"}</p>
                  </div>
                </div>
                <div className="summary-column column-intentsity">
                  <div className="title-label">
                    <span>{t("CO₂ Intentsity")}</span>
                  </div>
                  <div className="summary">
                    <p className="total">
                      {(summaryData?.totalCO2Intentsity ?? 0).toLocaleString(undefined, {
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
                    <span>{t("CO₂ Reduction")}</span>
                  </div>
                  <div className="summary">
                    <p className="total">
                    {(summaryData?.totalCO2Reduction ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 5,
      maximumFractionDigits: 5,
    })}
                    </p>
                    <p className="unit">{"TCO₂eq"}</p>
                  </div>
                </div>
              </div>
              <div className="scope-container">
                <div className="row">
                  <div className="col-12 col-xxl-5">
                    <div className="d-flex align-items-center justify-content-center">
                      {scopeImage && (
                        <div className="scope-img">
                          <img src={scopeImage} alt={`Scope ${scopeID}`} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-12 col-xxl-7">
                    <select
                      className="input-theme-select w-100"
                      style={{ marginBottom: "15px" }}
                      value={graphType}
                      onChange={(e) => setGraphType(e.target.value)}
                    >
                      <option value="year">{t("Yearly Data")}</option>
                      <option value="quarter">{t("Quarterly Data")}</option>
                    </select>
                    <select
                      className="input-theme-select w-100"
                      style={{ marginBottom: "15px" }}
                      value={graphView}
                      onChange={(e) => setGraphView(e.target.value)}
                    >
                      <option value="summary">{t("Graph Summary")}</option>
                      <option value="activities">
                        {t("Graph Activities")}
                      </option>
                    </select>
                    <div className="scope-chart">
                      {graphView === "summary" ? (
                        <GrapScope
                          key={`graph-${scopeID}-${refreshTrigger}`}
                          graphType={graphType}
                          refreshTrigger={refreshTrigger}
                          scopeID={scopeID}
                        />
                      ) : (
                        <GrapScopeTwo
                          key={`graph-${scopeID}-${refreshTrigger}`}
                          graphType={graphType}
                          refreshTrigger={refreshTrigger}
                          scopeID={scopeID}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="table-add-record-container">
                {loading ? (
                  <p>Loading data...</p>
                ) : (
                  <table className="table table-add-record">
                    <thead>
                      <tr>
                        <th
                          rowSpan="2"
                          className="text-center"
                          style={{ width: "5%" }}
                        >
                          #
                        </th>
                        <th rowSpan="2" style={{ width: "35%" }}>
                          {t("List")}
                        </th>
                        <th
                          rowSpan="2"
                          className="text-center"
                          style={{ width: "7.5%" }}
                        >
                          {t("Unit")}
                        </th>
                        <th colSpan="3" className="th-add-record text-center">
                          {t("Add Record")}
                        </th>
                        <th
                          rowSpan="2"
                          className="text-center"
                          style={{ width: "7.5%" }}
                        >
                          {t("GHG by Quarter (kgCO₂eq)")}
                        </th>
                        <th
                          rowSpan="2"
                          className="text-center"
                          style={{ width: "7.5%" }}
                        >
                          {t("Total GHG (kgCO₂eq)")}
                        </th>
                        <th
                          rowSpan="2"
                          className="text-center"
                          style={{ width: "7.5%" }}
                        >
                          {t("Estimated annual emissions (kgCO₂eq)")}
                        </th>
                      </tr>
                      <tr>
                        {months.map((month) => (
                          <th key={month.id} className="th-sub text-center">
                            {t(month.name)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {records.length > 0 ? (
                        records.map((record) => (
                          <tr
                            key={record.id}
                            className={record.isSubGroup ? "subgroup-row" : ""}
                          >
                            <td className="text-center">{record.id}</td>
                            <td
                              style={{
                                textAlign: "left",
                                paddingLeft: record.isSubGroup ? "35px" : "0",
                              }}
                            >
                              {currentLang === "th"
                                ? record.nameTH
                                : record.nameEN}
                            </td>
                            <td className="text-center">
                              {currentLang === "th"
                                ? record.unitTH
                                : record.unitEN}
                            </td>
                            {months.map((month) => (
                              <td key={month.id} className="text-center">
                                <EditableDropdownInput
                                  value={record[month.name]}
                                  onChange={(value) => {
                                    const updatedRecords = records.map((r) =>
                                      r.id === record.id
                                        ? { ...r, [month.name]: value }
                                        : r
                                    );
                                    setRecords(updatedRecords);
                                  }}
                                  handleCellBlur={handleCellBlur}
                                  id={record.id}
                                  column={month.name}
                                  disabled={
                                    isDisabled || record.inputType !== 1
                                  }
                                />
                              </td>
                            ))}
                            <td className="text-center">
                              {(record.GHGValue ?? 0) === 0.00
                                ? ""
                                : (record.GHGValue ?? 0).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                            </td>
                            <td className="text-center">
                              {(record.GHGPerActivityTotal ?? 0) === 0.00
                                ? ""
                                : (record.GHGPerActivityTotal ?? 0).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                            </td>
                            <td className="text-center">
                              {(record.estimatedAnnualResourceUseTotal ?? 0) === 0.00
                                ? ""
                                : (record.estimatedAnnualResourceUseTotal ?? 0).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="10" className="text-center">
                            {t("No data available")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
          <div className="form-add-report-action">
            <button
              type="button"
              className="btn btn-page-step"
              onClick={() =>
                scopeID === 1
                  ? navigate("/add-record")
                  : navigate(`/add-scope/${scopeID - 1}`)
              }
            >
              <img src="/images/icon/previous-button.png" alt="Previous" />
            </button>

            {scopeID !== 5 && (
              <button
                type="button"
                className="btn btn-page-step"
                onClick={() => navigate(`/add-scope/${scopeID + 1}`)}
              >
                <img src="/images/icon/next-button.png" alt="Next" />
              </button>
            )}

            <button
  type="button"
  className="btn btn-theme-green btn-save"
  onClick={() => {
    if ([1, 2, 3].includes(roleID)) {
      showConfirmModal();
    } else {
      message.warning(t("You do not have permission to submit."));
    }
  }}
  disabled={isDisabled || ![1, 2, 3].includes(roleID)}
>
  {t("submit")}
</button>

            <button
              type="button"
              className="btn btn-theme-success btn-save"
              onClick={() => handleSaveOrUpdate("save")}
              disabled={isDisabled || loadingSave}
            >
              {t("save")}
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
      <Modal
        title={t("Confirm Submit")}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={t("Submit")}
        cancelText={t("Cancel")}
        styles={{
          body: {
            fontSize: "16px"
          },
        }}
      >
        <p>{t("Are you sure you want to Submit?")}</p>
      </Modal>
    </div>
  );
};

export default AddScope;
