import React, { useLayoutEffect, useEffect, useState, useRef } from "react";
import axios from "axios";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5radar from "@amcharts/amcharts5/radar";  // Import Radar Chart
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import BASE_URL from "../config/apiConfig";

const GrapScopeTwo = ({ graphType, refreshTrigger, scopeID }) => {
  const [chartData, setChartData] = useState([]);
  const chartRoot = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const emissionDataStr = localStorage.getItem("emissionData");
        const emissionData = emissionDataStr ? JSON.parse(emissionDataStr) : {};
        const year = emissionData.year;
        const historyID = emissionData.historyID || null;
        const hospitalCode = localStorage.getItem("hospitalCode") || "";
        const token = localStorage.getItem("token");

        const url = `${BASE_URL}/dashboard/graph/summary/activity/${scopeID}`;

        let params = { year, graphType, hospitalCode };
        if (graphType === "quarter" && historyID) {
          params.historyID = historyID;
        }

        const response = await axios.get(url, {
          headers: { Authorization: token },
          params,
        });
        
        const apiData = response.data.data || [];
        const transformedData = apiData.length > 0 ? apiData.map((item) => ({

          category: item.groupDescriptionEN,
          value: item.percentOfTotalGHG,
          full: Math.max(...apiData.map(d => d.percentOfTotalGHG), 100),  
          columnSettings: { fill: am5.color("#3399ff") } 
        })) : [];
        //         const transformedData = apiData
        //   .filter(item => item.GHGPerActivityTotal > 0) 
        //   .map(item => ({
        //     category: item.groupDescriptionEN,
        //     value: item.GHGPerActivityTotal,
        //     full: Math.max(...apiData.map(d => d.GHGPerActivityTotal), 100),  
        //     columnSettings: { fill: am5.color("#3399ff") } 
        //   }));
        
        setChartData(transformedData);
      } catch (err) {
        console.error("Error fetching chart data:", err);
      }
    };

    fetchData();
  }, [graphType, refreshTrigger, scopeID]);

  useLayoutEffect(() => {
    if (chartRoot.current) {
      chartRoot.current.dispose();
    }

    let root = am5.Root.new("chartdiv");
    chartRoot.current = root;
    root.setThemes([am5themes_Animated.new(root)]);
    root._logo.dispose();

    let chart = root.container.children.push(am5radar.RadarChart.new(root, {
      panX: false,
      panY: false,
      wheelX: "panX",
      wheelY: "zoomX",
      innerRadius: am5.percent(20),
      startAngle: -90,
      endAngle: 180
    }));

    let xRenderer = am5radar.AxisRendererCircular.new(root, {});
    xRenderer.labels.template.setAll({ radius: 10 });
    xRenderer.grid.template.setAll({ forceHidden: true });

    let xAxis = chart.xAxes.push(am5xy.ValueAxis.new(root, {
        renderer: xRenderer,
        min: 0,
        max: Math.max(...chartData.map(d => d.full), 100), 
        strictMinMax: true,
        numberFormat: "#'%'",
        tooltip: am5.Tooltip.new(root, {})
      }));
      

    let yRenderer = am5radar.AxisRendererRadial.new(root, {});
    yRenderer.labels.template.setAll({
      centerX: am5.p100,
      fontWeight: "500",
      fontSize: 18,
      templateField: "columnSettings"
    });
    yRenderer.grid.template.setAll({ forceHidden: true });
    yRenderer.labels.template.setAll({ visible: false });

    let yAxis = chart.yAxes.push(am5xy.CategoryAxis.new(root, {
      categoryField: "category",
      renderer: yRenderer
    }));
    
    yAxis.data.setAll(chartData);

    let series1 = chart.series.push(am5radar.RadarColumnSeries.new(root, {
      xAxis: xAxis,
      yAxis: yAxis,
      clustered: false,
      valueXField: "full",
      categoryYField: "category",
      fill: root.interfaceColors.get("alternativeBackground")
    }));

    series1.columns.template.setAll({
      width: am5.p100,
      fillOpacity: 0.08,
      strokeOpacity: 0,
      cornerRadius: 20
    });

    series1.data.setAll(chartData);

    let series2 = chart.series.push(am5radar.RadarColumnSeries.new(root, {
      xAxis: xAxis,
      yAxis: yAxis,
      clustered: false,
      valueXField: "value",
      categoryYField: "category"
    }));

    series2.columns.template.setAll({
        width: am5.p100,
        strokeOpacity: 0,
        tooltipText: "{category}: {valueX}%",
        cornerRadius: 20,
        templateField: "columnSettings",
        fillGradient: am5.LinearGradient.new(root, {
          stops: [
            { color: am5.color(0x004c99) },  
            { color: am5.color(0x3399ff) },  
            { color: am5.color(0x99ccff) }   
          ],
          rotation: 90
        })
      });      
      

    series2.data.setAll(chartData);

    series1.appear(1000);
    series2.appear(1000);
    chart.appear(1000, 100);

    return () => {
      if (chartRoot.current) {
        chartRoot.current.dispose();
      }
    };
  }, [chartData]);

  return (
    <div>
      <div id="chartdiv" style={{ width: "100%", height: "350px" }}></div>
    </div>
  );
};

export default GrapScopeTwo;
