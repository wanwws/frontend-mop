import { Route, Routes, BrowserRouter, useParams } from "react-router-dom";
import HomeMoph from "./components/Home/HomeMoph";
import LoginMoph from "./components/LoginMoph/LoginMoph";
import EmissionsRecord from "./components/EmissionsRecord/EmissionsRecord";
import HospitalInfo from "./components/HospitalInfo/HospitalInfo";
import DashboardStaff from "./components/DashboardStaff/DashboardStaff";
import AddScope from "./components/AddScope/AddScope";
import PrivacyPolicy from "./components/PrivacyPolicy/PrivacyPolicy";
import TermsOfUse from "./components/TermsOfUse/TermsOfUse";
import Account from "./components/AccountManagement/Account";
import ChangePassword from "./components/ChangePassword/ChangePassword";
import StaffRequests from "./components/Admin/StaffRequests";
import SessionManagement from "./components/SessionManagement/SessionManagement";
import "./i18n";
import "./App.css";
import "./styles/global.css";
import ForgotPassword from "./components/ForgetPassword/ForgotPassword";
import ResetPassword from "./components/ForgetPassword/ResetPassword";
import FirstTimePassword from "./components/ForgetPassword/FirstTimePassword";
import UnlockAccount from "./components/AccountManagement/UnlockAccount";
import ExportData from "./components/Report/ExportData";
import ResendMail from "./components/ResendMail/ResendMail";
import ManageData from "./components/ManageData/ManageData";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeMoph />} />
          <Route path="/login-moph" element={<LoginMoph />} />
          <Route path="/emissions-record" element={<EmissionsRecord />} />
          <Route path="/add-record" element={<HospitalInfo />} />
          <Route path="/dashboard-staff" element={<DashboardStaff />} />
          <Route path="/add-scope/:scopeID" element={<AddScopeWrapper />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/account-management" element={<Account />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/staff-requests" element={<StaffRequests />} />
          <Route path="/session-management" element={<SessionManagement />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/reset-password/:referenceCode"
            element={<ResetPassword />}
          />
          <Route
            path="/first-time-password/:token"
            element={<FirstTimePassword />}
          />
          <Route path="/unlock-account" element={<UnlockAccount />} />
          <Route path="/export-data" element={<ExportData />} />
          <Route path="/resend-mail" element={<ResendMail />} />
          <Route path="/manage-data" element={<ManageData />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

const AddScopeWrapper = () => {
  const { scopeID } = useParams();
  const scopeNumber = parseInt(scopeID, 10);

  // ตรวจสอบ scopeID ก่อนส่งไปยัง AddScope
  if (isNaN(scopeNumber) || scopeNumber < 1 || scopeNumber > 5) {
    return <h2>Invalid Scope ID</h2>; // แสดงข้อความถ้าค่าไม่ถูกต้อง
  }

  return <AddScope scopeID={scopeNumber} />;
};

export default App;
