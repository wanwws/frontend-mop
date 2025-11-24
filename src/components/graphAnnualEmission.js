import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import BASE_URL from "../config/apiConfig";

const GraphAnnualEmission = ({ filters }) => {
  const chartRef = useRef(null);
  const chartContainerRef = useRef(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/dashboard/annual/emission`,
          { params: filters }
        );

        if (response.data?.data) {
          const formattedData = response.data.data.map((item) => ({
            period: `Quarter${item.quarter}/${item.year}`,
            sumGHGValue: item.sumGHGValue,
          }));
          setChartData(formattedData);
        }
      } catch (error) {
        console.error("Error fetching annual emission data:", error);
      }
    };

    fetchData();
  }, [filters]);

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
        panX: true,
        panY: false,
        wheelX: "panX",
        wheelY: "zoomX",
        layout: root.verticalLayout,
      })
    );

    let cursor = chart.set(
      "cursor",
      am5xy.XYCursor.new(root, {
        behavior: "none",
      })
    );
    cursor.lineY.set("visible", false);

    let xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: "period",
        renderer: am5xy.AxisRendererX.new(root, {
          minGridDistance: 50,
        }),
      })
    );
    xAxis.data.setAll(chartData);

    xAxis.get("renderer").labels.template.setAll({
      rotation: -20,
      centerY: am5.p50,
      centerX: am5.p50,
      oversizedBehavior: "wrap",
      maxWidth: 100,
      paddingTop: 10,
    });

    let yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {
          pan: "zoom",
        }),
        strictMinMax: true,
        min: Math.min(...chartData.map((i) => i.sumGHGValue)) * 0.95,
        max: Math.max(...chartData.map((i) => i.sumGHGValue)) * 1.05,
      })
    );

    let series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: "CO₂ Emission",
        xAxis,
        yAxis,
        valueYField: "sumGHGValue",
        categoryXField: "period",
        tooltip: am5.Tooltip.new(root, {
          labelText: "{categoryX} : {valueY}",
        }),
      })
    );

    series.strokes.template.setAll({
      strokeWidth: 3,
      stroke: am5.color("#FF5733"),
      strokeOpacity: 1,
    });

    series.bullets.push(() =>
      am5.Bullet.new(root, {
        sprite: am5.Circle.new(root, {
          radius: 5,
          fill: am5.color("#FF5733"),
          strokeWidth: 2,
        }),
      })
    );

    chart.set(
      "scrollbarX",
      am5.Scrollbar.new(root, {
        orientation: "horizontal",
      })
    );

    series.data.setAll(chartData);

    series.appear(1000, 100);
    chart.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [chartData]);

  return (
    <div className="chart-body">
      <div
        ref={chartContainerRef}
        className="chart-div"
        id="chartdiv-annual"
        style={{ width: "100%", height: "500px" }}
      ></div>
    </div>
  );
};

export default GraphAnnualEmission;
