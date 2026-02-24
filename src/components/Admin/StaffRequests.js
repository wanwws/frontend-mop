/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  message,
  Input,
  Select,
  Dropdown,
  Modal,
  Descriptions,
  Form,
  Empty,
} from "antd";
import {
  MoreOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  EditOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../../config/apiConfig";
import MenuPage from "../Menu/MenuPage";

const dash = (v) => (v === null || v === undefined || v === "" ? "-" : v);

const StaffRequests = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ===== permission by role =====
  const roleID = Number(localStorage.getItem("roleID") || 0);

  const PERMISSIONS = {
    VIEW_LIST: [1, 2, 3], // GET /staff/request
    ADD: [1, 2, 3], // POST /staff/request
    APPROVE: [1, 2, 3], // POST /staff/request/approve
    EDIT: [1, 2],
  };

  const hasPermission = (action) => PERMISSIONS[action]?.includes(roleID);

  const CAN_VIEW_LIST = hasPermission("VIEW_LIST");
  const CAN_ADD = hasPermission("ADD");
  const CAN_APPROVE = hasPermission("APPROVE");
  const CAN_EDIT = hasPermission("EDIT");

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");

  // profile modal
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // add staff request modal
  const [addOpen, setAddOpen] = useState(false);
  const [addForm] = Form.useForm();

  // access levels & roles
  const [accessLevels, setAccessLevels] = useState([]);
  const [accessLoading, setAccessLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  // access level that user selected
  const [selectedAccess, setSelectedAccess] = useState(null);

  // master data lists
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subDistricts, setSubDistricts] = useState([]);

  // loading states for master calls
  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingDistrict, setLoadingDistrict] = useState(false);
  const [loadingSubDistrict, setLoadingSubDistrict] = useState(false);
  const [loadingAgency, setLoadingAgency] = useState(false);

  // edit staff modal
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editForm] = Form.useForm();

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const getToken = () => localStorage.getItem("token");

  // ===== list page =====
  const fetchData = async () => {
    if (!CAN_VIEW_LIST) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/staff/request`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setRows(res?.data?.data ?? []);
    } catch (e) {
      console.error(e);
      const code = e?.response?.status;
      if (code === 403 || code === 401) {
        message.warning(t("You don't have permission to view requests."));
      } else {
        message.error(t("Load staff requests failed."));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [roleID]);

  const approve = async (userID, status) => {
    try {
      await axios.post(
        `${BASE_URL}/staff/request/approve`,
        { userID, status }, // 1 = approve, 2 = not approve
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      message.success(status === 1 ? t("Approved") : t("Not Approved"));
      fetchData();
    } catch (e) {
      console.error(e);
      message.error(e?.response?.data?.message || t("Update request failed."));
    }
  };

  const statusTag = (s) => {
    if (s === 1) return <Tag color="green">{t("Approved")}</Tag>;
    if (s === 2) return <Tag color="red">{t("Not Approved")}</Tag>;
    return <Tag color="gold">{t("Request")}</Tag>;
  };

  const filtered = rows.filter((r) => {
    const okStatus =
      statusFilter === "all" ? true : String(r.status) === statusFilter;
    const text = `${r.username ?? ""} ${r.agencyName ?? ""}   ${r.agencyCode ?? ""} ${
      r.provinceName ?? ""
    } ${r.districtName ?? ""}`.toLowerCase();
    const okQ = q ? text.includes(q.toLowerCase()) : true;
    return okStatus && okQ;
  });

  const Avatar = ({ name, email }) => {
    const ch = (name?.[0] || email?.[0] || "?").toUpperCase();
    return (
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "#7265e6",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
        }}
      >
        {ch}
      </div>
    );
  };

  const menuItems = (rec) => {
    const items = [
      {
        key: "view",
        icon: <UserOutlined />,
        label: t("View profile"),
        onClick: () => {
          setProfileData(rec);
          setProfileOpen(true);
        },
      },
    ];

    if (CAN_EDIT) {
      if (rec.status === 1) {
        // ✅ Approved → เพิ่มปุ่ม Edit
        items.push({ type: "divider" });
        items.push({
          key: "edit",
          icon: <EditOutlined style={{ color: "#1890ff" }} />,
          label: t("Edit"),
          onClick: async () => {
            await Promise.all([fetchRoles(), fetchAccessLevels()]);

            // ✅ preload จังหวัด/อำเภอ/ตำบล
            if (rec.zoneHealthCode) {
              await fetchProvinces(rec.zoneHealthCode, {
                provinceCode: rec.provinceCode,
                provinceName: rec.provinceName,
              });
            }
            if (rec.provinceCode) {
              await fetchDistricts(rec.provinceCode, {
                districtCode: rec.districtCode,
                districtName: rec.districtName,
              });
            }
            if (rec.provinceCode && rec.districtCode) {
              await fetchSubDistricts(rec.provinceCode, rec.districtCode, {
                subDistrictCode: rec.subDistrictCode,
                subDistrictName: rec.subDistrictName,
              });
            }

            // ✅ set ค่าเข้า form
            editForm.setFieldsValue({
              ...rec,
              email: rec.email || rec.username,
            });
            setEditData(rec);
            setSelectedAccess(rec.accessLevelID);
            setEditOpen(true);
          },
        });
      } else if (rec.status === 0) {
        // ✅ Request → มี Approve / Not Approve
        items.push({ type: "divider" });
        items.push({
          key: "approve",
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
          label: t("Approve"),
          onClick: () => approve(rec.userID, 1),
        });
        items.push({
          key: "reject",
          icon: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
          label: t("Not Approve"),
          onClick: () => approve(rec.userID, 2),
        });
      } else if (rec.status === 2) {
        // ❌ Not Approved → เหลือแค่ view profile
      }
    }

    return items;
  };

  const columns = [
    {
      title: t("Email"),
      key: "name",
      render: (rec) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar email={rec.username} />
          <div>
            <div>{rec.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: t("Role"),
      dataIndex: "roleDescription",
      key: "roleDescription",
      render: (val) => <div>{dash(val)}</div>,
      width: 180,
    },
    {
      title: t("Agency Name"),
      dataIndex: "agencyName",
      key: "agencyName",
      render: (v) => dash(v),
      ellipsis: true,
    },
    {
      title: t("Province"),
      dataIndex: "provinceName",
      key: "provinceName",
      render: (v) => dash(v),
      width: 140,
    },
    {
      title: t("District"),
      dataIndex: "districtName",
      key: "districtName",
      render: (v) => dash(v),
      width: 140,
    },
    {
      title: t("Status"),
      dataIndex: "status",
      key: "status",
      width: 140,
      render: statusTag,
    },
    {
      title: t("Active "),
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (val) => {
        if (val === 1) return <Tag color="green">{t("Active")}</Tag>;
        if (val === 0) return <Tag color="red">{t("Inactive")}</Tag>;
        return <Tag color="red">{t("Inactive")}</Tag>;
      },
    },
    ...(CAN_APPROVE
      ? [
          {
            title: t("Action"),
            key: "action",
            width: 80,
            align: "right",
            render: (_, rec) => (
              <Dropdown
                trigger={["click"]}
                menu={{ items: menuItems(rec) }}
                placement="bottomRight"
              >
                <Button type="text" icon={<MoreOutlined />} />
              </Dropdown>
            ),
          },
        ]
      : []),
  ];

  // ----- Add Staff Request handlers -----
  const openAdd = () => {
    if (!CAN_ADD) return message.error(t("You don't have permission."));

    addForm.resetFields();
    setSelectedAccess(null);
    fetchRoles();
    fetchAccessLevels();

    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");

    if (roleID === 3) {
      // 🔒 Super User → fix accessLevel เป็นหน่วยงาน (ID = 6)
      addForm.setFieldsValue({
        roleID: userInfo.roleID || undefined,
        accessLevelID: 6, // 👈 หน่วยงาน
        agencyCode: userInfo.agencyCode,
        agencyName: userInfo.agencyName,
        zoneHealthCode: userInfo.zoneHealthCode,
        provinceCode: userInfo.provinceCode,
        districtCode: userInfo.districtCode,
        subDistrictCode: userInfo.subDistrictCode,
      });
      setSelectedAccess(6); // ✅ lock rule ของหน่วยงาน
    } else {
      // default case
      addForm.setFieldsValue({
        roleID: userInfo.roleID || undefined,
        accessLevelID: undefined,
        agencyCode: undefined,
        agencyName: undefined,
        zoneHealthCode: undefined,
        provinceCode: undefined,
        districtCode: undefined,
        subDistrictCode: undefined,
      });
      setSelectedAccess(null);
    }

    setAddOpen(true);
  };

  const submitAdd = async () => {
    try {
      const vals = await addForm.validateFields();

      const payload = {
        email: vals.email?.trim(),
        roleID: Number(vals.roleID),
        accessLevelID: Number(vals.accessLevelID),
        agencyName: vals.agencyName?.trim(), // ชื่อหน่วยงาน ต้องมีเสมอ
        nameTH: vals.nameTH?.trim(),
        lastnameTH: vals.lastnameTH?.trim(),
        nameEN: vals.nameEN?.trim(),
        lastnameEN: vals.lastnameEN?.trim(),
        // optional / ตาม access rules
        zoneHealthCode: vals.zoneHealthCode || undefined,
        agencyCode: vals.agencyCode || undefined,
        provinceCode: vals.provinceCode || undefined,
        districtCode: vals.districtCode || undefined,
        subDistrictCode: vals.subDistrictCode || undefined,
        contact: vals.contact || undefined,
        department: vals.department || undefined,
        position: vals.position || undefined,
      };

      await axios.post(`${BASE_URL}/staff/request`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      message.success("Request add user success");
      setAddOpen(false);
      addForm.resetFields();
      fetchData();
    } catch (e) {
      if (e?.errorFields) return; // antd validate error
      console.error(e);
      message.error(e.response?.data?.message || "Create request failed.");
    }
  };

  const updateStaff = async () => {
    try {
      const vals = await editForm.validateFields();

      const payload = {
        email: vals.email?.trim(),
        roleID: Number(vals.roleID),
        accessLevelID: Number(vals.accessLevelID),
        agencyName: vals.agencyName?.trim(),
        nameTH: vals.nameTH?.trim(),
        lastnameTH: vals.lastnameTH?.trim(),
        nameEN: vals.nameEN?.trim(),
        lastnameEN: vals.lastnameEN?.trim(),
        agencyCode: vals.agencyCode || undefined,
        zoneHealthCode: vals.zoneHealthCode || undefined,
        provinceCode: vals.provinceCode || undefined,
        districtCode: vals.districtCode || undefined,
        subDistrictCode: vals.subDistrictCode || undefined,
        contact: vals.contact || undefined,
        department: vals.department || undefined,
        position: vals.position || undefined,
        isActive: vals.isActive ?? 1,
      };

      await axios.put(`${BASE_URL}/staff/user/information`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      message.success("Update staff success");
      setEditOpen(false);
      fetchData();
    } catch (e) {
      if (e?.errorFields) return;
      console.error(e);
      message.error(e.response?.data?.message || "Update failed.");
    }
  };

  // ----- Auth/Logout -----
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
      message.success("Logout successful!");
      navigate("/");
    }
  };

  // ----- master data -----
  const fetchAccessLevels = async () => {
    setAccessLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/master/access/level`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setAccessLevels(res?.data?.data ?? []);
    } catch (e) {
      console.error(e);
      message.error("Load access levels failed.");
    } finally {
      setAccessLoading(false);
    }
  };

  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/master/role`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setRoles(res?.data?.data ?? []);
    } catch (e) {
      console.error(e);
      message.error("Load roles failed.");
    } finally {
      setRolesLoading(false);
    }
  };

  const fetchProvinces = async (zoneHealthCode, preset) => {
    if (!zoneHealthCode) {
      setProvinces([]);
      setDistricts([]);
      setSubDistricts([]);
      addForm.setFieldsValue({
        provinceCode: undefined,
        districtCode: undefined,
        subDistrictCode: undefined,
      });
      return;
    }
    setLoadingProvince(true);
    try {
      const res = await axios.get(`${BASE_URL}/master/province`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: { zoneHealthCode },
      });

      let list = res?.data?.data ?? [];

      // ถ้ามี preset (จาก agency) และยังไม่อยู่ใน list → เติมเข้าไป
      if (preset && preset.provinceCode && preset.provinceName) {
        const exists = list.some((p) => p.provinceCode === preset.provinceCode);
        if (!exists) {
          list.push({
            provinceCode: preset.provinceCode,
            nameTH: preset.provinceName,
          });
        }
      }

      setProvinces(list);
    } catch (e) {
      message.error("Load provinces failed.");
    } finally {
      setLoadingProvince(false);
    }
  };

  const fetchDistricts = async (provinceCode, preset) => {
    if (!provinceCode) {
      setDistricts([]);
      setSubDistricts([]);
      addForm.setFieldsValue({
        districtCode: undefined,
        subDistrictCode: undefined,
      });
      return;
    }
    setLoadingDistrict(true);
    try {
      const res = await axios.get(`${BASE_URL}/master/district`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: { provinceCode },
      });

      let list = res?.data?.data ?? [];

      if (preset && preset.districtCode && preset.districtName) {
        const exists = list.some((d) => d.districtCode === preset.districtCode);
        if (!exists) {
          list.push({
            districtCode: preset.districtCode,
            nameTH: preset.districtName,
          });
        }
      }

      setDistricts(list);
    } catch (e) {
      message.error("Load districts failed.");
    } finally {
      setLoadingDistrict(false);
    }
  };

  const fetchSubDistricts = async (provinceCode, districtCode, preset) => {
    if (!provinceCode || !districtCode) {
      setSubDistricts([]);
      addForm.setFieldsValue({ subDistrictCode: undefined });
      return;
    }
    setLoadingSubDistrict(true);
    try {
      const res = await axios.get(`${BASE_URL}/master/subdistrict`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: { provinceCode, districtCode },
      });

      let list = res?.data?.data ?? [];

      // ถ้ามี preset (เช่นจาก agency) และมันยังไม่อยู่ใน list → เติมเข้าไป
      if (preset && preset.subDistrictCode && preset.subDistrictName) {
        const exists = list.some(
          (s) => s.subDistrictCode === preset.subDistrictCode
        );
        if (!exists) {
          list = [
            ...list,
            {
              subDistrictCode: preset.subDistrictCode,
              nameTH: preset.subDistrictName,
            },
          ];
        }
      }

      setSubDistricts(list);
    } catch (e) {
      message.error("Load subdistricts failed.");
    } finally {
      setLoadingSubDistrict(false);
    }
  };

  const getZoneFromAgency = (a) =>
    a?.zoneHealthCode ?? a?.zoneHealtCode ?? a?.officeZoneHealthID ?? undefined;

  const fetchAgencyNameByCode = async (code) => {
    const agencyCode = (code || "").trim();
    if (!agencyCode) {
      addForm.setFieldsValue({
        agencyName: undefined,
        zoneHealthCode: undefined,
        provinceCode: undefined,
        districtCode: undefined,
        subDistrictCode: undefined,
      });
      setProvinces([]);
      setDistricts([]);
      setSubDistricts([]);
      return;
    }

    setLoadingAgency(true);
    try {
      const res = await axios.get(`${BASE_URL}/master/agency`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: { agencyCode },
      });

      let agency = null;
      const data = res?.data?.data;
      if (Array.isArray(data)) agency = data[0] || null;
      else if (data && typeof data === "object") agency = data;

      if (!agency) {
        message.warning("ไม่พบรหัสหน่วยงานนี้");
        addForm.setFieldsValue({
          agencyName: undefined,
          zoneHealthCode: undefined,
          provinceCode: undefined,
          districtCode: undefined,
          subDistrictCode: undefined,
        });
        setProvinces([]);
        setDistricts([]);
        setSubDistricts([]);
        return;
      }

      // 1) ตั้งค่า agency + zone
      const zone = String(getZoneFromAgency(agency) ?? "");
      addForm.setFieldsValue({
        agencyName: agency.agencyName || agency.nameTH || agency.nameEN || "",
        zoneHealthCode: isGrey("zoneHealthCode")
          ? undefined
          : zone || undefined,
      });

      // 2) Province
      const provinceCode =
        agency.provinceCode || agency.provinceID || undefined;
      if (!isGrey("provinceCode") && zone && provinceCode) {
        await fetchProvinces(zone, {
          provinceCode,
          provinceName: agency.provinceName,
        });
        addForm.setFieldsValue({ provinceCode });
      }

      // 3) District
      const districtCode = agency.districtCode || undefined;
      if (!isGrey("districtCode") && provinceCode && districtCode) {
        await fetchDistricts(provinceCode, {
          districtCode,
          districtName: agency.districtName,
        });
        addForm.setFieldsValue({ districtCode });
      }

      // 4) Subdistrict
      const subDistrictCode = agency.subDistrictCode || undefined;
      if (
        !isGrey("subDistrictCode") &&
        provinceCode &&
        districtCode &&
        subDistrictCode
      ) {
        await fetchSubDistricts(provinceCode, districtCode, {
          subDistrictCode,
          subDistrictName: agency.subDistrictName,
        });
        addForm.setFieldsValue({ subDistrictCode });
      }
    } catch (e) {
      console.error(e);
      message.error("ค้นหาหน่วยงานไม่สำเร็จ");
      addForm.setFieldsValue({
        agencyName: undefined,
        zoneHealthCode: undefined,
        provinceCode: undefined,
        districtCode: undefined,
        subDistrictCode: undefined,
      });
      setProvinces([]);
      setDistricts([]);
      setSubDistricts([]);
    } finally {
      setLoadingAgency(false);
    }
  };

  // ล้างค่าฟิลด์ + ล้าง option lists ที่ขึ้นกับ access level
  const clearAccessLevelDependents = () => {
    addForm.resetFields([
      "zoneHealthCode",
      "provinceCode",
      "districtCode",
      "subDistrictCode",
      "agencyCode",
      "agencyName",
    ]);
    setProvinces([]);
    setDistricts([]);
    setSubDistricts([]);
  };

  // ===== access rules (ตามตารางที่ให้มา) =====
  const accessRules = {
    1: {
      required: [],
      grey: [
        "agencyCode",
        "agencyName",
        "zoneHealthCode",
        "provinceCode",
        "districtCode",
        "subDistrictCode",
      ],
    },
    2: {
      required: [],
      grey: ["provinceCode", "districtCode", "subDistrictCode"],
    },
    3: {
      required: [],
      grey: ["districtCode", "subDistrictCode"],
    },
    4: {
      required: [],
      grey: ["subDistrictCode"],
    },
    5: {
      required: [],
      grey: [],
    },
    6: {
      required: [],
      grey: [],
    },
  };

  const isRequired = (field) =>
    !!(selectedAccess && accessRules[selectedAccess]?.required.includes(field));
  const isGrey = (field) =>
    !!(selectedAccess && accessRules[selectedAccess]?.grey.includes(field));

  const clearAccessLevelDependentsEdit = () => {
    editForm.setFieldsValue({
      zoneHealthCode: undefined,
      provinceCode: undefined,
      districtCode: undefined,
      subDistrictCode: undefined,
      agencyCode: undefined,
      agencyName: undefined,
    });

    setProvinces([]);
    setDistricts([]);
    setSubDistricts([]);
  };

  const fetchAgencyNameByCodeEdit = async (code) => {
    const agencyCode = (code || "").trim();
    if (!agencyCode) {
      editForm.setFieldsValue({
        agencyName: undefined,
        zoneHealthCode: undefined,
        provinceCode: undefined,
        districtCode: undefined,
        subDistrictCode: undefined,
      });
      setProvinces([]);
      setDistricts([]);
      setSubDistricts([]);
      return;
    }

    setLoadingAgency(true);
    try {
      const res = await axios.get(`${BASE_URL}/master/agency`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: { agencyCode },
      });

      let agency = null;
      const data = res?.data?.data;
      if (Array.isArray(data)) agency = data[0] || null;
      else if (data && typeof data === "object") agency = data;

      if (!agency) {
        message.warning("ไม่พบรหัสหน่วยงานนี้");
        editForm.setFieldsValue({
          agencyName: undefined,
          zoneHealthCode: undefined,
          provinceCode: undefined,
          districtCode: undefined,
          subDistrictCode: undefined,
        });
        setProvinces([]);
        setDistricts([]);
        setSubDistricts([]);
        return;
      }

      const zone = String(getZoneFromAgency(agency) ?? "");

      editForm.setFieldsValue({
        agencyName: agency.agencyName || agency.nameTH || agency.nameEN || "",
        zoneHealthCode: isGrey("zoneHealthCode")
          ? undefined
          : zone || undefined,
      });

      const provinceCode =
        agency.provinceCode || agency.provinceID || undefined;
      if (!isGrey("provinceCode") && zone && provinceCode) {
        await fetchProvinces(zone, {
          provinceCode,
          provinceName: agency.provinceName,
        });
        editForm.setFieldsValue({ provinceCode });
      }

      const districtCode = agency.districtCode || undefined;
      if (!isGrey("districtCode") && provinceCode && districtCode) {
        await fetchDistricts(provinceCode, {
          districtCode,
          districtName: agency.districtName,
        });
        editForm.setFieldsValue({ districtCode });
      }

      const subDistrictCode = agency.subDistrictCode || undefined;
      if (
        !isGrey("subDistrictCode") &&
        provinceCode &&
        districtCode &&
        subDistrictCode
      ) {
        await fetchSubDistricts(provinceCode, districtCode, {
          subDistrictCode,
          subDistrictName: agency.subDistrictName,
        });
        editForm.setFieldsValue({ subDistrictCode });
      }
    } catch (e) {
      console.error(e);
      message.error("ค้นหาหน่วยงานไม่สำเร็จ");
      editForm.setFieldsValue({
        agencyName: undefined,
        zoneHealthCode: undefined,
        provinceCode: undefined,
        districtCode: undefined,
        subDistrictCode: undefined,
      });
      setProvinces([]);
      setDistricts([]);
      setSubDistricts([]);
    } finally {
      setLoadingAgency(false);
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
                  <p>{t("STAFF REQUESTS")}</p>
                </div>
              </div>
            </div>

            <div className="content-body">
              <div
                className="form-add-record"
                style={{ background: "transparent" }}
              >
                {/* Filters + Add button */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 12,
                    justifyContent: "space-between",
                  }}
                >
                  {CAN_VIEW_LIST ? (
                    <div
                      style={{ display: "flex", gap: 12, alignItems: "center" }}
                    >
                      <Input
                        placeholder={t("Search email/agency/province")}
                        allowClear
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        style={{ maxWidth: 320 }}
                      />
                      <Select
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 180 }}
                        options={[
                          { value: "0", label: t("Request") },
                          { value: "1", label: t("Approved") },
                          { value: "2", label: t("Not Approved") },
                          { value: "all", label: t("All") },
                        ]}
                      />
                      <Button onClick={fetchData}>{t("Refresh")}</Button>
                    </div>
                  ) : (
                    <div />
                  )}

                  {CAN_ADD && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={openAdd}
                    >
                      {t("Add staff request")}
                    </Button>
                  )}
                </div>

                {CAN_VIEW_LIST ? (
                  <Table
                    rowKey="userID"
                    loading={loading}
                    columns={columns}
                    dataSource={filtered}
                    pagination={{ pageSize: 8 }}
                    bordered
                    scroll={{ x: "max-content" }}
                    sticky
                    style={{ whiteSpace: "nowrap" }}
                  />
                ) : (
                  <div
                    style={{
                      background: "rgba(255,255,255,0.75)",
                      borderRadius: 12,
                      padding: 24,
                      border: "1px solid #eaeaea",
                    }}
                  >
                    <Empty
                      description={
                        <span>
                          {t(
                            "You can submit a staff request. Only System Admin/Staff/Super User can view the list."
                          )}
                        </span>
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <Modal
        open={profileOpen}
        onCancel={() => setProfileOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setProfileOpen(false)}>{t("Close")}</Button>
          </Space>
        }
        title={
          <Space>
            <UserOutlined />
            <span>{t("ProfileStaff")}</span>
            <span style={{ color: "#8a8a8a", fontWeight: 400 }}>
              ({dash(profileData?.username)})
            </span>
          </Space>
        }
        width={800}
      >
        {profileData && (
          <Descriptions
            bordered
            size="small"
            column={2}
            labelStyle={{ width: 220, background: "#f8f9fb" }}
          >
            <Descriptions.Item label={t("First name (TH)")}>
              {dash(profileData.nameTH)}
            </Descriptions.Item>
            <Descriptions.Item label={t("Last name (TH)")}>
              {dash(profileData.lastnameTH)}
            </Descriptions.Item>
            <Descriptions.Item label={t("First name (EN)")}>
              {dash(profileData.nameEN)}
            </Descriptions.Item>
            <Descriptions.Item label={t("Last name (EN)")}>
              {dash(profileData.lastnameEN)}
            </Descriptions.Item>
            <Descriptions.Item label={t("Role")}>
              {dash(profileData.roleDescription)}
            </Descriptions.Item>
            <Descriptions.Item label={t("Access Level")}>
              {dash(profileData.accessLevelDescription)}
            </Descriptions.Item>
            <Descriptions.Item label={t("Agency Code")}>
              {dash(profileData.agencyCode)}
            </Descriptions.Item>
            <Descriptions.Item label={t("Agency Name")}>
              {dash(profileData.agencyName)}
            </Descriptions.Item>
            <Descriptions.Item label={t("Province")}>
              {dash(profileData.provinceName)} ({dash(profileData.provinceCode)}
              )
            </Descriptions.Item>
            <Descriptions.Item label={t("District")}>
              {dash(profileData.districtName)} ({dash(profileData.districtCode)}
              )
            </Descriptions.Item>
            <Descriptions.Item label={t("Subdistrict")}>
              {dash(profileData.subDistrictName)} (
              {dash(profileData.subDistrictCode)})
            </Descriptions.Item>
            <Descriptions.Item label={t("Zone Health Code")}>
              {dash(profileData.zoneHealthCode)}
            </Descriptions.Item>
            <Descriptions.Item label={t("Department")}>
              {dash(profileData.department)}
            </Descriptions.Item>
            <Descriptions.Item label={t("Position")}>
              {dash(profileData.position)}
            </Descriptions.Item>
            <Descriptions.Item label={t("Contact")} span={2}>
              {dash(profileData.contact)}
            </Descriptions.Item>
            <Descriptions.Item label={t("Status")} span={2}>
              {statusTag(profileData.status)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Edit Staff Modal */}
      <Modal
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={updateStaff}
        okText={t("Save")}
        cancelText={t("Cancel")}
        title={
          <Space>
            <UserOutlined />
            <span>{t("Edit Staff")}</span>
            <span style={{ color: "#8a8a8a", fontWeight: 400 }}>
              ({dash(editData?.username)})
            </span>
          </Space>
        }
        width={900}
      >
        {editData && (
          <Form form={editForm} layout="vertical" initialValues={editData}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {/* Email */}
              <Form.Item
                name="email"
                label={t("Email")}
                rules={[{ required: true, message: "Email is required" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="contact" label={t("Contact")}>
                <Input />
              </Form.Item>

              {/* First/Last TH */}
              <Form.Item
                name="nameTH"
                label={t("First name (TH)")}
                rules={[{ required: true, message: "Required" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="lastnameTH"
                label={t("Last name (TH)")}
                rules={[{ required: true, message: "Required" }]}
              >
                <Input />
              </Form.Item>

              {/* First/Last EN */}
              <Form.Item
                name="nameEN"
                label={t("First name (EN)")}
                rules={[{ required: true, message: "Required" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="lastnameEN"
                label={t("Last name (EN)")}
                rules={[{ required: true, message: "Required" }]}
              >
                <Input />
              </Form.Item>

              {/* Contact / Department / Position */}
              {/* <Form.Item name="contact" label="Contact">
                <Input />
              </Form.Item> */}
              <Form.Item name="department" label={t("Department")}>
                <Input />
              </Form.Item>
              <Form.Item name="position" label={t("Position")}>
                <Input />
              </Form.Item>

              {/* Role */}
              <Form.Item
                name="roleID"
                label={t("Role")}
                rules={[{ required: true, message: "Required" }]}
              >
                <Select
                  placeholder="Select role"
                  loading={rolesLoading}
                  showSearch
                  optionFilterProp="label"
                  options={roles.map((r) => ({
                    value: r.staffRoleID,
                    label: r.description,
                  }))}
                />
              </Form.Item>

              {/* Access Level */}
              <Form.Item name="accessLevelID" label={t("Access Level")}>
                <Select
                  loading={accessLoading}
                  showSearch
                  optionFilterProp="label"
                  options={accessLevels.map((lv) => ({
                    value: lv.accessLevelID,
                    label: lv.description,
                  }))}
                  onChange={(val) => {
                    setSelectedAccess(val);

                    // เคลียร์ข้อมูลเก่าทั้งหมด
                    clearAccessLevelDependentsEdit();

                    // เคลียร์ options state
                    setProvinces([]);
                    setDistricts([]);
                    setSubDistricts([]);

                    // เคลียร์ค่าที่เคย preload จาก rec
                    editForm.setFieldsValue({
                      provinceCode: undefined,
                      districtCode: undefined,
                      subDistrictCode: undefined,
                    });
                  }}
                />
              </Form.Item>

              {/* Agency */}
              <Form.Item name="agencyCode" label={t("Agency Code")}>
                <Input
                  disabled={isGrey("agencyCode")}
                  onBlur={(e) => {
                    if (!isGrey("agencyCode")) {
                      fetchAgencyNameByCodeEdit(e.target.value);
                    }
                  }}
                />
              </Form.Item>

              <Form.Item name="agencyName" label={t("Agency Name")}>
                <Input
                  disabled={isGrey("agencyName")}
                  readOnly={
                    !isGrey("agencyName") &&
                    !!editForm.getFieldValue("agencyCode")
                  }
                />
              </Form.Item>

              {/* Zone / Province / District / Subdistrict */}
              <Form.Item name="zoneHealthCode" label={t("Zone Health Code")}>
                <Input
                  disabled={isGrey("zoneHealthCode")}
                  readOnly={
                    !isGrey("zoneHealthCode") &&
                    !!editForm.getFieldValue("agencyCode")
                  }
                  onBlur={(e) => {
                    const val = e.target.value?.trim();
                    if (val) fetchProvinces(val);
                  }}
                />
              </Form.Item>

              <Form.Item name="provinceCode" label={t("Province")}>
                <Select
                  options={provinces.map((p) => ({
                    value: p.provinceCode,
                    label: p.nameTH,
                  }))}
                  disabled={isGrey("provinceCode")}
                  onChange={(val) => fetchDistricts(val)}
                />
              </Form.Item>

              <Form.Item name="districtCode" label={t("District")}>
                <Select
                  disabled={isGrey("districtCode")}
                  options={districts.map((d) => ({
                    value: d.districtCode,
                    label: d.nameTH,
                  }))}
                  onChange={(val) =>
                    fetchSubDistricts(
                      editForm.getFieldValue("provinceCode"),
                      val
                    )
                  }
                />
              </Form.Item>

              <Form.Item name="subDistrictCode" label={t("Subdistrict")}>
                <Select
                  disabled={isGrey("subDistrictCode")}
                  options={subDistricts.map((s) => ({
                    value: s.subDistrictCode,
                    label: s.nameTH,
                  }))}
                />
              </Form.Item>

              {/* Active */}
              <Form.Item name="isActive" label={t("ActiveStaff")}>
                <Select
                  options={[
                    { value: 1, label: t("Active") },
                    { value: 0, label: t("Inactive") },
                  ]}
                />
              </Form.Item>
            </div>
          </Form>
        )}
      </Modal>

      {/* Add Staff Request Modal */}
      <Modal
        open={addOpen}
        onCancel={() => {
          setAddOpen(false);
          setSelectedAccess(null);
        }}
        onOk={submitAdd}
        okText={t("Submit")}
        cancelText={t("Cancel")}
        title={
          <Space>
            <PlusOutlined />
            <span>{t("Add Staff Request")}</span>
          </Space>
        }
        width={900}
      >
        <Form
          form={addForm}
          layout="vertical"
          initialValues={{ roleID: undefined, accessLevelID: undefined }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            {/* Email */}
            <Form.Item
              name="email"
              label={t("Email")}
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Please enter a valid email" },
                {
                  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email format (ex: user@example.com)",
                },
              ]}
            >
              <Input placeholder="email@example.com" />
            </Form.Item>

            <Form.Item name="contact" label={t("Contact")}>
              <Input />
            </Form.Item>

            {/* First/Last TH & EN */}
            <Form.Item
              name="nameTH"
              label={t("First name (TH)")}
              rules={[{ required: true, message: "Required" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="lastnameTH"
              label={t("Last name (TH)")}
              rules={[{ required: true, message: "Required" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="nameEN"
              label={t("First name (EN)")}
              rules={[{ required: true, message: "Required" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="lastnameEN"
              label={t("Last name (EN)")}
              rules={[{ required: true, message: "Required" }]}
            >
              <Input />
            </Form.Item>

            {/* Contact / Department / Position */}
            {/* <Form.Item name="contact" label="Contact">
              <Input />
            </Form.Item> */}
            <Form.Item name="department" label={t("Department")}>
              <Input />
            </Form.Item>
            <Form.Item name="position" label={t("Position")}>
              <Input />
            </Form.Item>

            {/* Role */}
            <Form.Item
              name="roleID"
              label={t("Role")}
              rules={[{ required: true, message: "Required" }]}
            >
              <Select
                placeholder="Select role"
                loading={rolesLoading}
                showSearch
                optionFilterProp="label"
                options={roles.map((r) => ({
                  value: r.staffRoleID,
                  label: r.description,
                }))}
              />
            </Form.Item>

            {/* Access Level */}
            <Form.Item
              name="accessLevelID"
              label={t("Access Level")}
              rules={[{ required: true, message: "Required" }]}
            >
              <Select
                placeholder="Select access level"
                loading={accessLoading}
                showSearch
                optionFilterProp="label"
                options={accessLevels.map((lv) => ({
                  value: lv.accessLevelID,
                  label: lv.description,
                }))}
                onChange={(val) => {
                  setSelectedAccess(val);
                  clearAccessLevelDependents();
                }}
                open={roleID === 3 ? false : undefined}
              />
            </Form.Item>

            {/* Agency Code */}
            <Form.Item
              name="agencyCode"
              label={t("Agency Code")}
              rules={[
                { required: isRequired("agencyCode"), message: "Required" },
              ]}
            >
              <Input
                readOnly={roleID === 3}
                disabled={isGrey("agencyCode")}
                onBlur={(e) => {
                  if (!isGrey("agencyCode")) {
                    fetchAgencyNameByCode(e.target.value);
                  }
                }}
                onChange={(e) => {
                  if (!e.target.value) {
                    addForm.setFieldsValue({
                      agencyName: undefined,
                      zoneHealthCode: undefined,
                      provinceCode: undefined,
                      districtCode: undefined,
                      subDistrictCode: undefined,
                    });
                    setProvinces([]);
                    setDistricts([]);
                    setSubDistricts([]);
                  }
                }}
              />
            </Form.Item>

            {/* Agency Name */}
            <Form.Item name="agencyName" label={t("Agency Name")} rules={[]}>
              <Input
                disabled={isGrey("agencyName")}
                readOnly={
                  !isGrey("agencyName") && !!addForm.getFieldValue("agencyCode")
                }
              />
            </Form.Item>

            {/* Zone Health Code */}
            <Form.Item
              name="zoneHealthCode"
              label={t("Zone Health Code")}
              rules={[
                { required: isRequired("zoneHealthCode"), message: "Required" },
              ]}
            >
              <Input
                readOnly={
                  !isGrey("zoneHealthCode") &&
                  !!addForm.getFieldValue("agencyCode")
                }
                disabled={isGrey("zoneHealthCode")}
                onBlur={(e) => {
                  const val = e.target.value?.trim();
                  if (val) {
                    fetchProvinces(val); // ✅ โหลด province list ตาม zone
                  }
                }}
              />
            </Form.Item>

            {/* Province Code */}
            <Form.Item
              name="provinceCode"
              label={t("Province")}
              rules={[
                { required: isRequired("provinceCode"), message: "Required" },
              ]}
            >
              <Select
                value={addForm.getFieldValue("provinceCode")}
                options={provinces.map((p) => ({
                  value: p.provinceCode,
                  label: p.nameTH || p.provinceName,
                }))}
                loading={loadingProvince}
                disabled={isGrey("provinceCode")} // case 1: access level grey → disable
                open={
                  !isGrey("provinceCode") &&
                  !!addForm.getFieldValue("agencyCode")
                    ? false // case 2: agency code มีค่า → read-only (dropdown ไม่เด้ง)
                    : undefined // case 3: agency code ว่าง → เลือกได้ปกติ
                }
                onChange={(val) => fetchDistricts(val)}
              />
            </Form.Item>

            {/* District Code */}
            <Form.Item
              name="districtCode"
              label={t("District")}
              rules={[
                { required: isRequired("districtCode"), message: "Required" },
              ]}
            >
              <Select
                loading={loadingDistrict}
                options={districts.map((d) => ({
                  value: d.districtCode,
                  label: d.nameTH || d.districtName,
                }))}
                onFocus={() => {
                  const province = addForm.getFieldValue("provinceCode");
                  if (province && districts.length === 0) {
                    fetchDistricts(province);
                  }
                }}
                onChange={(val) =>
                  fetchSubDistricts(addForm.getFieldValue("provinceCode"), val)
                }
                disabled={isGrey("districtCode")}
                open={
                  !isGrey("districtCode") &&
                  !!addForm.getFieldValue("agencyCode")
                    ? false
                    : undefined
                }
              />
            </Form.Item>

            {/* Subdistrict Code */}
            <Form.Item
              name="subDistrictCode"
              label={t("Subdistrict")}
              rules={[
                {
                  required: isRequired("subDistrictCode"),
                  message: "Required",
                },
              ]}
            >
              <Select
                loading={loadingSubDistrict}
                options={subDistricts.map((s) => ({
                  value: s.subDistrictCode,
                  label: s.nameTH || s.subDistrictName,
                }))}
                disabled={isGrey("subDistrictCode")}
                open={
                  !isGrey("subDistrictCode") &&
                  !!addForm.getFieldValue("agencyCode")
                    ? false // ถ้า Agency Code มีค่า → read-only
                    : undefined
                }
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
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

export default StaffRequests;
