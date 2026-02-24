import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import BASE_URL from "../config/apiConfig";

const GraphZoneHealth = ({ filters, onDataLoaded, language }) => {
  const chartRef = useRef(null);
  const chartContainerRef = useRef(null);
  const [chartData, setChartData] = useState([]);
  const [sumAllTotalZoneHealth, setsumAllTotalZoneHealth] = useState(0);

  useEffect(() => {
    const { yearFilter, yearFrom, yearTo } = filters;
    const filteredParams = { yearFilter, yearFrom, yearTo };
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/dashboard/total/zonehealth`,
          { params: filteredParams }
        );
        
        if (response.data?.data) {
          const { data } = response.data.data;
          const formattedData = data.map((item) => ({
            category:
              language === "th"
                ? `เขต ${item.zoneHealth}`
                : `AH${item.zoneHealth}`,
            value: item.percentOfTotalGHG,
          }));
          setChartData(formattedData);
          setsumAllTotalZoneHealth(response.data.data.sumAllTotalGHG || 0);
          if (onDataLoaded) {
            onDataLoaded(response.data.data.sumAllTotalGHG || 0);
          }
        }
      } catch (error) {
        console.error("Error fetching zone health data:", error);
      }
    };

    fetchData();
  }, [filters, language]);

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
      am5percent.PieChart.new(root, {
        endAngle: 270,
        layout: root.verticalLayout,
        innerRadius: am5.percent(60),
      })
    );

    let series = chart.series.push(
      am5percent.PieSeries.new(root, {
        name: "Total CO₂ Emissions",
        categoryField: "category",
        valueField: "value",
        endAngle: 270,
      })
    );

    series.labels.template.adapters.add("text", (text, target) => {
      return target.dataItem?.dataContext?.value > 0 ? text : "";
    });

    series.labels.template.setAll({
      forceHidden: true,
    });

    series.slices.template.setAll({
      strokeWidth: 2,
      stroke: am5.color(0xffffff),
      cornerRadius: 10,
      shadowOpacity: 0.1,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      shadowColor: am5.color(0x000000),
      fillPattern: am5.GrainPattern.new(root, {
        maxOpacity: 0.2,
        density: 0.5,
        colors: [am5.color(0x000000)],
      }),
    });

    series.slices.template.states.create("hover", {
      shadowOpacity: 1,
      shadowBlur: 10,
    });

    series.ticks.template.setAll({
      visible: false,
    });

    series.states.create("hidden", {
      endAngle: -90,
    });

    series.set(
      "colors",
      am5.ColorSet.new(root, {
        colors: [
          am5.color(0x73556e),
          am5.color(0x9fa1a6),
          am5.color(0xf2aa6b),
          am5.color(0xf28f6b),
          am5.color(0xa95a52),
          am5.color(0xe35b5d),
          am5.color(0xffa446),
        ],
      })
    );

    series.data.setAll(chartData);

    let legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.percent(50),
        x: am5.percent(50),
        marginTop: 15,
        marginBottom: 15,
      })
    );

    legend.markerRectangles.template.adapters.add("fillGradient", () => {
      return undefined;
    });

    legend.data.setAll(series.dataItems);

    series.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [chartData]);

  return (
    <div className="chart-body">
      <div
        ref={chartContainerRef}
        className="chart-div"
        id="chartdiv-zone"
        style={{ width: "100%", height: "500px" }}
      ></div>
      <p hidden>{sumAllTotalZoneHealth}</p>
    </div>
  );
};

export default GraphZoneHealth;
