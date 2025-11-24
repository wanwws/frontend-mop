import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import BASE_URL from "../config/apiConfig";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

const GraphReduction = ({ filters, onDataLoaded }) => {
  const { i18n, t } = useTranslation();
  const [reductionData, setReductionData] = useState({
    totalCO2Reduction: 0,
    methods: [],
  });

  useEffect(() => {
    const fetchReductionData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/dashboard/reduction`, {
          params: filters,
        });

        if (response.data?.data) {
          const { sumAllTotalGHG, data } = response.data.data;
          const TH_DESCRIPTION_MAP = {
            "Reduction from using Solar cells":
              "การลดก๊าซ CO₂ จากการใช้โซลาร์เซลล์",
            "Change electrical equipment to save energy":
              "การเปลี่ยนอุปกรณ์ไฟฟ้าเพื่อลดการใช้พลังงาน",
            "Using electric cars": "การใช้รถยนต์ไฟฟ้า",
            "Reduction from using Telemedicine":
              "การลดก๊าซ CO₂ จากการใช้บริการโทรเวชกรรม",
              "Emission savings from recycling":
              "การลดก๊าซเรือนกระจกจากการรีไซเคิล",
          };
          const DROP_COLORS = ["#00B633", "#14B8A6", "#52525B", "#A16207", "#0091EA"];
          setReductionData({
            totalCO2Reduction: sumAllTotalGHG || 0,
            methods: data.map((item, index) => ({
              name:
                i18n.language === "th"
                  ? TH_DESCRIPTION_MAP[item.descriptionEN] || item.descriptionEN
                  : item.descriptionEN,
              percentage: parseFloat(item.percentOfTotalGHG) || 0,
              reductionValue: parseFloat(item.sumTotalGHG) || 0,
              dropColor: DROP_COLORS[index] || "#00B633",
            })),
          });
          if (onDataLoaded) {
            onDataLoaded(sumAllTotalGHG || 0);
          }
        }
      } catch (error) {
        console.error("Error fetching reduction data:", error);
      }
    };

    fetchReductionData();
  }, [filters, i18n.language]);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-label">{t("CO₂ Reduction")}</div>
        <div className="chart-summary">
          <p className="total">
            {reductionData.totalCO2Reduction.toLocaleString()}
          </p>
          <p className="unit">{t("TCO₂eq")}</p>
        </div>
      </div>
      <div className="chart-body">
        <div className="chart-5-container">
          {reductionData.methods.map((method, index) => (
            <div className="chart-row" key={index}>
              <div
                className="chart-icon"
                data-tooltip-id={`tooltip-drop-${index}`}
                data-tooltip-content={`${method.reductionValue}`}
              >
                <img src={`/images/water-drop-${index + 1}.png`} alt="" />
                <span>{method.percentage}%</span>
              </div>
              <div className="chart-content">
                <p className="mb-1">{method.name}</p>
                <div className="chart-bar">
                  <div
                    className="chart-percent"
                    data-tooltip-id={`tooltip-bar-${index}`}
                    data-tooltip-content={`${method.reductionValue}, (${method.percentage}%)`}
                    style={{
                      width: `${method.percentage}%`,
                      background: method.dropColor,
                    }}
                  ></div>
                  <Tooltip
                    id={`tooltip-bar-${index}`}
                    place="top"
                    style={{
                      backgroundColor: method.dropColor,
                      color: "#fff",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      fontSize: "15px",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {reductionData.methods.map((method, index) => (
        <Tooltip
          key={`drop-${index}`}
          id={`tooltip-drop-${index}`}
          place="top"
          style={{
            backgroundColor: method.dropColor,
            color: "#fff",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "15px",
          }}
        />
      ))}
    </div>
  );
};

export default GraphReduction;
