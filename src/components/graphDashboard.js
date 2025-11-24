import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import BASE_URL from "../config/apiConfig";

const GrapDashboard = ({ filters, onDataLoaded, language }) => {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState([]);
  const [sumAllTotalGHG, setSumAllTotalGHG] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/dashboard/total/serviceplan`,
          {
            params: {
              yearFilter: filters.yearFilter,
              yearFrom: filters.yearFrom,
              yearTo: filters.yearTo,
              provinceCode: filters.provinceCode || undefined,
              districtCode: filters.districtCode || undefined,
              hospitalCode: filters.hospitalCode || undefined,
            },
          }
        );

        if (response.data?.data) {
          setSumAllTotalGHG(response.data.data.sumAllTotalGHG || 0);
          if (onDataLoaded) {
            onDataLoaded(response.data.data.sumAllTotalGHG || 0);
          }

          const formattedData = response.data.data.data.map((item) => {
            let servicePlanName = item.servicePlanName;

            if (language === "th") {
              const translations = {
                A: "รพศ.\n(A)",
                S: "รพท.ระดับจังหวัด\n(S)",
                M1: "รพท.ขนาดเล็ก\n(M1)",
                M2: "รพช.แม่ข่าย\n(M2)",
                F1: "รพช. ขนาดใหญ่\n(F1)",
                F2: "รพช. ขนาดกลาง\n(F2)",
                F3: "รพช. ขนาดเล็ก\n(F3)",
              };
              servicePlanName =
                translations[item.servicePlanName] || item.servicePlanName;
            } else {
              servicePlanName = `Hospital\nLevel ${item.servicePlanName}`;
            }

            let dataObj = { servicePlan: servicePlanName };

            item.dataOfScope.forEach((scope) => {
              dataObj[`scope${scope.scopeID}`] = scope.sumTotalGHGOfScope;
            });

            return dataObj;
          });

          setChartData(formattedData);
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };

    fetchData();
  }, [filters, language, onDataLoaded]);

  useEffect(() => {
    if (chartData.length === 0) return;

    let root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);
    root._logo.dispose();

    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        layout: root.verticalLayout,
        paddingTop: 50,
        paddingLeft: 20, //  ป้องกันแท่งติดขอบซ้าย
        paddingRight: 20, //  ป้องกันแท่งติดขอบขวา
      })
    );

    let legend = chart.topAxesContainer.children.push(
      am5.Legend.new(root, {
        x: am5.p50,
        centerX: am5.p50,
        width: am5.percent(100),
        layout: am5.GridLayout.new(root, {}),
        paddingBottom: 10,
      })
    );

    let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineX.set("visible", false);
    cursor.lineY.set("visible", false);

    let xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "servicePlan",
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: 40, //  ปรับให้แท่งกราฟไม่เบียดกันมากไป
          labels: { text: "{category}", centerX: am5.p50, centerY: am5.p50 },
          adjustedWidth: am5.percent(70), //  ลดความกว้างของกราฟ
          tooltip: am5.Tooltip.new(root, {}),
        }),
      })
    );
    xAxis.get("renderer").grid.template.setAll({ visible: false });

    let yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
        min: 0,
        strictMinMax: true,
        extraMax: 0.05,
      })
    );

    yAxis.set(
      "max",
      Math.max(
        ...chartData.map(
          (d) =>
            (d.scope1 || 0) +
            (d.scope2 || 0) +
            (d.scope3 || 0) +
            (d.scope4 || 0)
        )
      )
    );

    yAxis.get("renderer").labels.template.set("visible", false);

    xAxis.data.setAll(chartData);

    const scopes = ["scope1", "scope2", "scope3", "scope4"];
    const colors = ["#9F6B3A", "#00B633", "#1AABA1", "#276268"];
    const scopeNames = {
      en: ["Scope 1", "Scope 2", "Scope 3", "Non Protocol"],
      th: ["ขอบเขตที่ 1", "ขอบเขตที่ 2", "ขอบเขตที่ 3", "ขอบเขตอื่น ๆ"],
    };

    scopes.forEach((scope, index) => {
      let series = chart.series.push(
        am5xy.ColumnSeries.new(root, {
          name: scopeNames[language][index],
          xAxis,
          yAxis,
          valueYField: scope,
          categoryXField: "servicePlan",
          stacked: true,
        })
      );

      series.set(
        "tooltip",
        am5.Tooltip.new(root, {
          labelText: "[bold]{name}:[/] {valueY.formatNumber('#,###')}",
        })
      );

      series.data.setAll(chartData);

      series.columns.template.setAll({
        fill: am5.color(colors[index]),
        stroke: am5.color(colors[index]),
        cornerRadiusTL: 0,
        cornerRadiusTR: 0,
        cornerRadiusBL: 0,
        cornerRadiusBR: 0,
        // tooltipText: "[bold]{name}:[/] {valueY.formatNumber('#,###')}",
        width: am5.percent(50), //  ลดขนาดแท่งกราฟ
        maxWidth: 30, //  ป้องกันไม่ให้ใหญ่เกินไป
        minWidth: 15, //  ไม่ให้เล็กเกินไป
      });
    });

    legend.data.setAll(chart.series.values);

    chartRef.current = root;

    return () => {
      root.dispose();
    };
  }, [chartData]);

  return (
    <div>
      <div id="chartdiv" style={{ width: "100%", height: "500px" }} />
      <p hidden>{sumAllTotalGHG}</p>
    </div>
  );
};

export default GrapDashboard;
