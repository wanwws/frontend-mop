import React, { useEffect, useState } from "react";
import { Alert, message as antMessage } from "antd";
import Marquee from "react-fast-marquee";
import axios from "axios";
import BASE_URL from "../config/apiConfig";

const BAR_HEIGHT = 46;

const AnnouncementBar = () => {
  const [text, setText] = useState("");

  useEffect(() => {
    axios
      .get(`${BASE_URL}/master/config`)
      .then((res) => {
        const data = res?.data?.data;
        if (data?.mode === "live" && data?.announcement) {
          setText(data.announcement);
          antMessage.config({ top: BAR_HEIGHT });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch config:", err);
      });
    return () => {
      antMessage.config({ top: 8 });
    };
  }, []);

  if (!text) return null;

  return (
    <div
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10000 }}
    >
      <Alert
        banner
        type="info"
        icon={null}
        showIcon={false}
        style={{
          backgroundColor: "#0D7664",
          borderColor: "#0D7664",
          color: "white",
          fontWeight: "500",
          fontSize: "18px",
        }}
        message={
          <Marquee pauseOnHover gradient={false} style={{ color: "white" }}>
            📢 &nbsp;{text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </Marquee>
        }
      />
    </div>
  );
};

export default AnnouncementBar;
