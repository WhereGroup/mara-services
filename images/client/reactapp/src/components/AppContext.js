import React, { useCallback, useRef, useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";

import { ExportToCsv } from "export-to-csv";

const debug = false;

//const backendUrl = "/backend";
var backendUrl = "/backend";
var headers = new Headers();
if (document.location.host === "localhost:3000") {
  backendUrl = "http://localhost/backend";
  headers.set('Authorization', 'Basic ' + btoa( "MARAPTM:m4R4!973"));
}
const AppContext = React.createContext({});
const AppStateProvider = AppContext.Provider;

const AppContextProvider = ({ children }) => {
  const fetchMobilityThrottleTimestampRef = useRef(undefined);

  const fetchRegionsThrottleTimestampRef = useRef(undefined);
  const initializedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [mobilityDataLoading, setMobilityDataLoading] = useState(false);

  const [regionsGeojson, setRegionsGeojson] = useState(undefined);
  const [mobilityGeojson, setMobilityGeojson] = useState(undefined);

  const [regionColoring, setRegionColoring] = useState("mobility");

  const [showIncoming, setShowIncoming] = useState(true);
  const [showOutgoing, setShowOutgoing] = useState(false);
  const [days, setDays] = useState(1);
  const [showDailyMobility, setShowDailyMobility] = useState(true);
  const [showDailyMobilityAsInterval, setShowDailyMobilityAsInterval] = useState(
    false
  );
  const latestTimestampRef = useRef(undefined);
  const latestMobilityRequestTimestampRef = useRef(undefined);
  const latestRequestConfigRef = useRef(undefined);
  const [hours, setHours] = useState(0);
  const [showHourlyMobility, setShowHourlyMobility] = useState(false);
  const [showHourlyMobilityAsInterval, setShowHourlyMobilityAsInterval] = useState(
    false
  );
  const [selectedRegionId, setSelectedRegionId] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(undefined);
  const selectedRegionIdRef = useRef(false);

  // Multipliers to adjust coloring intervals to current form setting
  const hourlyMultiplier = useMemo(() => {
    let multiplyHourly = 1;
    if (
      showHourlyMobility &&
      showHourlyMobilityAsInterval &&
      hours.length > 1 &&
      hours[0] !== hours[1]
    ) {
      let hoursCnt = hours[1] - hours[0] + 1;
      multiplyHourly = 0.05 * hoursCnt;
    } else if (
      showHourlyMobility &&
      (!showHourlyMobilityAsInterval ||
        (showHourlyMobilityAsInterval && hours.length > 1 && hours[0] === hours[1]))
    ) {
      multiplyHourly = 0.05;
    }

    return multiplyHourly;
  }, [hours, showHourlyMobility, showHourlyMobilityAsInterval]);

  const dailyMultiplier = useMemo(() => {
    let multiply = 1;

    if (
      showDailyMobility &&
      showDailyMobilityAsInterval &&
      days.length > 1 &&
      days[0] !== days[1]
    ) {
      multiply = days[1] - days[0] + 1;
    } else if (!showDailyMobility) {
      multiply = 7;
    }

    return multiply;
  }, [days, showDailyMobility, showDailyMobilityAsInterval]);

  // MlGeoJsonLayer paint configs 
  const mobilityLineColor = useMemo(() => {
    return [
      "interpolate",
      ["linear"],
      ["get", "count_pt"],
      0,
      "#d7191c",
      Math.round(20 * dailyMultiplier * hourlyMultiplier),
      "#ffea15",
      Math.round(40 * dailyMultiplier * hourlyMultiplier),
      "#1a9641",
    ];
  }, [dailyMultiplier, hourlyMultiplier]);

  const mobilityLineWidth = useMemo(() => {

    return [
      "interpolate",
      ["linear"],
      ["get", "count_mobility"],
      0,
      2,
      Math.round(25 * dailyMultiplier * hourlyMultiplier),
      5,
      Math.round(50 * dailyMultiplier * hourlyMultiplier),
      9,
      Math.round(75 * dailyMultiplier * hourlyMultiplier),
      13,
      Math.round(100 * dailyMultiplier * hourlyMultiplier),
      17,
    ];
  }, [dailyMultiplier, hourlyMultiplier]);

  const regionFillColor = useMemo(() => {

    return regionColoring === "mobility"
      ? [
          "interpolate",
          ["linear"],
          ["get", "count_mobility"],
          0,
          "#f2f2f2",
          1 * dailyMultiplier * hourlyMultiplier,
          "#ffffcc",
          400 * dailyMultiplier * hourlyMultiplier,
          "#a1dab4",
          800 * dailyMultiplier * hourlyMultiplier,
          "#41b6c4",
          1200 * dailyMultiplier * hourlyMultiplier,
          "#2c7fb8",
          1600 * dailyMultiplier * hourlyMultiplier,
          "#253494",
        ]
      : [
          "interpolate",
          ["linear"],
          ["get", "count_pt"],
          0,
          "#f2f2f2",
          20 * dailyMultiplier * hourlyMultiplier,
          "#ffffcc",
          40 * dailyMultiplier * hourlyMultiplier,
          "#a1dab4",
          60 * dailyMultiplier * hourlyMultiplier,
          "#41b6c4",
          80 * dailyMultiplier * hourlyMultiplier,
          "#2c7fb8",
          100 * dailyMultiplier * hourlyMultiplier,
          "#253494",
        ];
  }, [regionColoring,dailyMultiplier, hourlyMultiplier]);

  /** fetch region functions/hooks **/
  const getDaysQueryValue = useCallback(() => {
    let value = days;

    if (!showDailyMobility) {
      return [0, 1, 2, 3, 4, 5, 6];
    }
    if (showDailyMobilityAsInterval) {
      value = [...days];
      let i = value[0] + 1;
      if (i !== value[1]) {
        let iMax = value[1];
        let pos = 1;
        for (i = value[0] + 1; i < iMax; i++) {
          value.splice(pos, 0, i);
          pos++;
        }
      }
      if (value.indexOf(7) !== -1) {
        value[value.indexOf(7)] = 0;
      }
    }

    return value === 7 ? 0 : value;
  }, [days, showDailyMobility, showDailyMobilityAsInterval]);

  const getHoursQueryValue = useCallback(() => {
    let value = hours;

    if (!showHourlyMobility) {
      return [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
      ];
    }
    if (showHourlyMobilityAsInterval) {
      value = [...hours];
      let i = value[0] + 1;
      if (i !== value[1]) {
        let iMax = value[1];
        let pos = 1;
        for (i = value[0] + 1; i < iMax; i++) {
          value.splice(pos, 0, i);
          pos++;
        }
      }
    }

    return value;
  }, [hours, showHourlyMobility, showHourlyMobilityAsInterval]);

  const getQueryStringParams = useCallback(() => {
    let params = {
      hours: getHoursQueryValue(),
      days: getDaysQueryValue(),
      timestamp: new Date().getTime(),
    };

    return params;
  }, [getDaysQueryValue, getHoursQueryValue]);

  const fetchRegions = useCallback(() => {
    let resource_name = "get_incoming_regions";
    if (showOutgoing) {
      resource_name = "get_outgoing_regions";
    }
    let params = getQueryStringParams();

    // present repeating requests with the exact same configuration
    let latestRequestConfig = JSON.stringify({
      days: params.days,
      hours: params.hours,
      resource_name,
    });
    if (latestRequestConfig === latestRequestConfigRef.current) {
      ////console.log(latestRequestConfig + " " + latestRequestConfigRef.current);
      //setLoading(false);
      return;
    }
    setLoading(true);
    latestRequestConfigRef.current = latestRequestConfig;

    // prevent showing data for an old form state by only displaying data from the latest request that was submitted
    latestTimestampRef.current = params.timestamp;

    fetch(
      backendUrl +
        "/api/" +
        resource_name +
        "?" +
      new URLSearchParams(params).toString(),
      {headers: headers}
    )
      .then((response) => response.json())
      .then((data) => {
        if (latestTimestampRef.current === params.timestamp) {
          setRegionsGeojson(data.data);

          if (
            selectedRegion &&
            typeof data.data !== "undefined" &&
            typeof data.data.features !== "undefined" &&
            typeof data.data.features.forEach === "function"
          ) {
            data.data.features.forEach((item) => {
              if (
                item.properties.region + "" ===
                selectedRegion.properties.region + ""
              ) {
                //console.log(item);
                setSelectedRegion(item);
              }
            });
          }

          setTimeout(() => {
            setLoading(false);
          }, 500);
        }
      })
      .catch(() => {});
  }, [getQueryStringParams, showOutgoing, selectedRegion]);

  const fetchRegionsThrottled = useCallback(() => {
    let waitTime = 500; // wait this amount of ms after each form state change until actually submitting a request, to prevent unnessesary requests
    fetchRegionsThrottleTimestampRef.current = new Date().getTime();

    setTimeout(() => {
      // less time passed than waitTime indicates another request has been initiated since this call, so just ignore it and go with the more recent one
      let passedTime =
        new Date().getTime() - fetchRegionsThrottleTimestampRef.current;
      if (passedTime >= waitTime) {
        fetchRegions();
      }
    }, waitTime);
  }, [fetchRegions]);

  useEffect(() => {
    if (initializedRef.current) return;

    initializedRef.current = true;

    //fetchRegions();
  }, []);

  useEffect(() => {
    fetchRegionsThrottled();
  }, [
    showIncoming,
    showDailyMobility,
    showDailyMobilityAsInterval,
    showHourlyMobility,
    showHourlyMobilityAsInterval,
    days,
    hours,
    fetchRegionsThrottled,
  ]);
  /** end fetch region functions/hooks **/

  /** fetch mobility functions/hooks **/
  const fetchMobility = useCallback(() => {
    setMobilityDataLoading(true);
    let resource_name = "get_incoming_mobility";
    if (showOutgoing) {
      resource_name = "get_outgoing_mobility";
    }
    let params = getQueryStringParams();
    params.region_id = selectedRegionId;

    latestMobilityRequestTimestampRef.current = params.timestamp;
    fetch(
      backendUrl +
        "/api/" +
        resource_name +
        "?" +
      new URLSearchParams(params).toString(),
      {headers: headers}
    )
      .then((response) => response.json())
      .then((data) => {
        if (latestMobilityRequestTimestampRef.current === params.timestamp) {
          if (!data.data.features) {
            data.data.features = [];
          }
          setMobilityGeojson(data.data);

          setTimeout(() => {
            setMobilityDataLoading(false);
          }, 500);
        }
      });
  }, [getQueryStringParams, selectedRegionId, showOutgoing]);

  const fetchMobilityThrottled = useCallback(() => {
    let waitTime = 500; // wait this amount of ms after each form state change until actually submitting a request, to prevent unnessesary requests
    fetchMobilityThrottleTimestampRef.current = new Date().getTime();

    setTimeout(() => {
      // less time passed than waitTime indicates another request has been initiated since this call, so just ignore it and go with the more recent one
      let passedTime =
        new Date().getTime() - fetchMobilityThrottleTimestampRef.current;
      if (passedTime >= waitTime) {
        fetchMobility();
      }
    }, waitTime);
  }, [fetchMobility]);

  useEffect(() => {
    if (selectedRegionId) {
      fetchMobilityThrottled();
    }
  }, [
    showOutgoing,
    showDailyMobility,
    showDailyMobilityAsInterval,
    showHourlyMobility,
    showHourlyMobilityAsInterval,
    days,
    hours,
    selectedRegionId,
    fetchMobilityThrottled,
  ]);

  const value = {
    regionsGeojson,
    mobilityGeojson,
    setMobilityGeojson,
    backendUrl,
    debug,
    showIncoming,
    showIncomingChangeHandler: (e) => {
      setShowOutgoing(showIncoming);
      setShowIncoming(!showIncoming);
    },
    showOutgoing,
    showOutgoingChangeHandler: (e) => {
      setShowIncoming(showOutgoing);
      setShowOutgoing(!showOutgoing);
    },
    showDailyMobility,
    showDailyMobilityChangeHandler: (e) => {
      setShowDailyMobility(!showDailyMobility);
    },
    showDailyMobilityAsInterval,
    showDailyMobilityAsIntervalChangeHandler: (e) => {
      // this is correct as we are checking the variables before setters are called
      if (!showDailyMobilityAsInterval && typeof days === "number") {
        setDays([days, days]);
      } else if (showDailyMobilityAsInterval && typeof days === "object") {
        setDays(days[0]);
      }
      setShowDailyMobilityAsInterval(!showDailyMobilityAsInterval);
    },
    showHourlyMobility,
    showHourlyMobilityChangeHandler: (e) => {
      setShowHourlyMobility(!showHourlyMobility);
    },
    showHourlyMobilityAsInterval,
    showHourlyMobilityAsIntervalChangeHandler: (e) => {
      // this is correct as we are checking the variables before setters are called
      if (!showHourlyMobilityAsInterval && typeof hours === "number") {
        setHours([hours, hours]);
      } else if (showHourlyMobilityAsInterval && typeof hours === "object") {
        setHours(hours[0]);
      }
      setShowHourlyMobilityAsInterval(!showHourlyMobilityAsInterval);
    },
    days,
    changeDaysHandler: (ev, value) => {
      setDays(value);
    },
    hours,
    changeHoursHandler: (ev, value) => {
      setHours(value);
    },
    loading,
    mobilityDataLoading,
    selectedRegionId,
    setSelectedRegionId,
    selectedRegionIdRef,
    selectedRegion,
    setSelectedRegion,
    regionColoring,
    setRegionColoring,
    regionFillColor,
    mobilityLineColor,
    mobilityLineWidth,
    exportMobilityAsCsv: () => {
      let _data = [];

      if (typeof mobilityGeojson.features) {
        mobilityGeojson.features.forEach((el) => {
          _data.push({ ...el.properties });
        });
      }

      const csvExporter = new ExportToCsv({
        fieldSeparator: ",",
        quoteStrings: '"',
        decimalSeparator: ".",
        showLabels: true,
        showTitle: true,
        title: "MARA PTM export",
        useTextFile: false,
        useBom: true,
        useKeysAsHeaders: true,
        filename:
          "MARA_PTM_export_days_" +
          (!showDailyMobility
            ? "1-7"
            : JSON.stringify(days)
                .replace("[", "")
                .replace("]", "")
                .replaceAll(",", "-")) +
          "_hours_" +
          (!showHourlyMobility
            ? "0-23"
            : JSON.stringify(hours)
                .replace("[", "")
                .replace("]", "")
                .replaceAll(",", "-")),
      });

      csvExporter.generateCsv(_data);
    },
  };

  return <AppStateProvider value={value}>{children}</AppStateProvider>;
};

AppContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { AppContext, AppContextProvider };
