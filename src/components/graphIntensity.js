import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { useTranslation } from "react-i18next";
import BASE_URL from "../config/apiConfig";

const GraphIntensity = ({ filters, onDataLoaded }) => {
  const chartRef = useRef(null);
  const chartContainerRef = useRef(null);
  const { i18n, t } = useTranslation();
  const [chartData, setChartData] = useState([]);
  const [totalIntensity, setTotalIntensity] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/dashboard/total/serviceplan`,
          { params: filters }
        );
        if (response.data?.data) {
          const { 
            sumAllIntentsity
            , data } = response.data.data;
          setTotalIntensity(sumAllIntentsity);

          const colors = [
            "#9F6B3A",
            "#00B633",
            "#1AABA1",
            "#276268",
            "#C83C00",
            "#25408D",
            "#5B5B5C",
            "#8A2BE2",
          ];

          const formattedData = data.map((item, index) => ({
            servicePlan: item.servicePlanName,
            intensityValue: item.sumTotalCO2Intentsity || 0,
            color: colors[index % colors.length],
          }));
          setChartData(formattedData);

          if (onDataLoaded) {
            onDataLoaded(sumAllIntentsity);
          }
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };

    fetchData();
  }, [filters, i18n.language]);

  useEffect(() => {
    if (chartData.length === 0 || !chartContainerRef.current) return;

    if (chartRef.current) {
      chartRef.current.dispose();
    }

    let root = am5.Root.new(chartContainerRef.current);
    chartRef.current = root;
    root.setThemes([am5themes_Animated.new(root)]);
    root._logo.dispose();

    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        layout: root.verticalLayout,
        paddingTop: 10,
        paddingLeft: 10,
        paddingRight: 10,
      })
    );

    let xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "servicePlan",
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: 40,
          inside: false,
        }),
      })
    );
    xAxis.get("renderer").grid.template.setAll({ visible: false });

    let yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
        min: 0,
      })
    );
    yAxis.get("renderer").labels.template.set("visible", false);

    xAxis.data.setAll(chartData);
    let series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "CO₂ Intensity",
        xAxis,
        yAxis,
        valueYField: "intensityValue",
        categoryXField: "servicePlan",
        tooltip: am5.Tooltip.new(root, {
          labelText: `${t("Hospital_level")} {categoryX}: {valueY}`,
        }),
      })
    );

    series.columns.template.setAll({
      tooltipText: "{categoryX}: {valueY} ",
      strokeWidth: 2,
      strokeOpacity: 1,
      cornerRadiusTL: 10,
      cornerRadiusTR: 10,
    });

    series.columns.template.adapters.add("fill", (fill, target) => {
      const color = target.dataItem?.dataContext?.color || "#000000";
      return am5.color(color);
    });

    series.columns.template.adapters.add("stroke", (stroke, target) => {
      return am5.color(target.dataItem?.dataContext?.color || "#000000");
    });

    series.data.setAll(chartData);

    return () => {
      root.dispose();
    };
  }, [chartData]);

  return (
    <div className="chart-body">
      <div
        ref={chartContainerRef}
        className="chart-div"
        style={{ width: "100%", height: "500px" }}
      ></div>
      <p hidden>{totalIntensity}</p>
    </div>
  );
};

export default GraphIntensity;
