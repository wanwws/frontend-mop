import React, { useLayoutEffect, useEffect, useState, useRef } from "react";
import axios from "axios";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { useTranslation } from "react-i18next";
import BASE_URL from "../config/apiConfig";

const GrapScope = ({ graphType, refreshTrigger, scopeID }) => {
  const { t, i18n } = useTranslation();
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRoot = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const emissionDataStr = localStorage.getItem("emissionData");
        const emissionData = emissionDataStr ? JSON.parse(emissionDataStr) : {};
        const year = emissionData.year;
        const historyID = emissionData.historyID || null;
        const hospitalCode = localStorage.getItem("hospitalCode") || "";
        const token = localStorage.getItem("token");

        const url = `${BASE_URL}/dashboard/graph/summary/quarter/${scopeID}`;

        let params = { year, graphType, hospitalCode };

        if (graphType === "quarter" && !historyID) {
          setChartData([]);
          return;
        }

        if (graphType === "quarter" && historyID) {
          params.historyID = historyID;
        }

        const response = await axios.get(url, {
          headers: { Authorization: token },
          params,
        });
        const apiData = response.data.data || [];
        const transformedData =
          apiData.length > 0
            ? apiData.map((item) => ({
                category: `Quarter ${item.quarterID}`,
                GHGValue: item.GHGValue,
                GHGPerActivityTotal: item.GHGPerActivityTotal,
                estimatedAnnualResourceUseTotal:
                  item.estimatedAnnualResourceUseTotal,
              }))
            : [];

        setChartData(transformedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [graphType, refreshTrigger, i18n.language, scopeID]);

  useLayoutEffect(() => {
    if (chartRoot.current) {
      chartRoot.current.dispose();
    }

    let root = am5.Root.new("chartdiv");
    chartRoot.current = root;
    root.setThemes([am5themes_Animated.new(root)]);
    root._logo.dispose();

    let chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true,
      })
    );

    if (chart) {
      chart.set("paddingLeft", 0);
      if (chart.get("plotContainer")) {
        chart.get("plotContainer").set("paddingLeft", 0);
      }
    }

    let xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "category",
        renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 30 }),
        tooltip: am5.Tooltip.new(root, {}),
      })
    );

    // ✅ ถ้าไม่มีข้อมูล ให้แสดง "No Data" บนแกน X
    if (chartData.length === 0) {
      xAxis.data.setAll([{ category: "No Data" }]);
    } else {
      xAxis.data.setAll(chartData);
    }

    if (xAxis) {
      xAxis.get("renderer").setAll({
        minGridDistance: 30,
        cellStartLocation: 0.2,
        cellEndLocation: 0.8,
      });
    }

    xAxis.get("renderer").grid.template.setAll({ visible: false });

    let yAxis = chart.yAxes.push(
  am5xy.ValueAxis.new(root, {
    renderer: am5xy.AxisRendererY.new(root, {}),
    strictMinMax: false,
   extraMin: 0.2, 
    extraMax: 0.1
  })
);

    // yAxis.get("renderer").grid.template.setAll({ visible: false });
    yAxis.get("renderer").labels.template.set("visible", false);

    let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineX.set("visible", false);
    cursor.lineY.set("visible", false);

    const createSeries = (field, name, stackGroup, color) => {
      let series = chart.series.push(
        am5xy.ColumnSeries.new(root, {
          name,
          xAxis,
          yAxis,
          valueYField: field,
          categoryXField: "category",
          clustered: true,
          stacked: false,
          fill: am5.color(color),
        })
      );

      if (stackGroup) {
        series.set("stackGroup", stackGroup);
      }

      series.columns.template.setAll({
        maxWidth: 50,
      });

      series.set(
        "tooltip",
        am5.Tooltip.new(root, {
          labelText: "[bold]{name}:[/] {valueY.formatNumber('#,###')}",
        })
      );

      series.data.setAll(chartData.length > 0 ? chartData : []);

      series.appear();
      return series;
    };

    createSeries("GHGValue", t("Quarterly emissions"), "group1", "#9F6B3A");
    createSeries(
      "GHGPerActivityTotal",
      t("Cumulative emissions"),
      "group1",
      "#00B633"
    );
    createSeries(
      "estimatedAnnualResourceUseTotal",
      t("Estimated annual emissions"),
      "group1",
      "#1AABA1"
    );
    let legend = am5.Legend.new(root, {
      layout: root.horizontalLayout,
      centerX: am5.p50,
      x: am5.p50,
      maxWidth: am5.p100,
      marginTop: 10,
      paddingTop: 5,
      fitContent: true,
    });

    legend.labels.template.setAll({
      fontSize: 15,
      maxWidth: 120,
      wrap: true,
      textAlign: "center",
      oversizedBehavior: "wrap",
      multiLine: true,
    });

    chart.bottomAxesContainer.children.push(legend);
    legend.data.setAll(chart.series.values);

    chart.set("width", am5.p100);
    chart.set("height", am5.p100);
    chart.set("paddingBottom", 20);
    chart.appear(1000, 100);

    return () => {
      if (chartRoot.current) {
        chartRoot.current.dispose();
      }
    };
  }, [chartData]);

  return (
    <div>
      {/* {isLoading && <p>Loading chart data...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>} */}
      <div id="chartdiv" style={{ width: "100%", height: "350px" }}></div>
    </div>
  );
};

export default GrapScope;
