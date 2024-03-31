import React, { useEffect, useState } from "react";
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Accelerometer,
  AccelerometerMeasurement,
  Gyroscope,
  GyroscopeMeasurement,
} from "expo-sensors";
import {
  Chart,
  Line,
  HorizontalAxis,
  VerticalAxis,
} from "react-native-responsive-linechart";
import axios from "axios";
import Toast from "react-native-root-toast";
import { useSelector } from "react-redux";
import { selectUrl } from "../slices/databaseUrlSlice";
import useSensorsUpdate from "../hooks/useSensorsUpdate";
import useLocationUpdate from "../hooks/useLocationUpdate";
// import axiosBasicInstance from "../config/axiosConfig";

type dataType = {
  speed?: number;
  gyroX?: number;
  gyroY?: number;
  gyroZ?: number;
  accX?: number;
  accY?: number;
  accZ?: number;
};

function qualityStreamComponent() {
  const [showChart, setShowChart] = useState<boolean>(false);
  const [permission, setPermission] = useState({
    acc: false,
    gyro: false,
  });
  const [hardCodedSpeed, setHardCodedSpeed] = useState<string | undefined>(
    undefined
  );
  const databaseUrl = useSelector(selectUrl);

  useEffect(() => {
    requestpermission();
  }, []);

  const requestpermission = async () => {
    console.log("requesting permissions");
    const accPermissions = await Accelerometer.requestPermissionsAsync();
    const gyroPermissions = await Gyroscope.requestPermissionsAsync();
    setPermission({
      acc: accPermissions.granted,
      gyro: gyroPermissions.granted,
    });
  };

  const {
    dataArray,
    toggleSensorsSubscription,
    _slow,
    _fast,
    isFast,
    isRunning,
  } = useSensorsUpdate();
  const { location, toggleLocationSubscription, locationUpdateSubscription } =
    useLocationUpdate(1000);

  useEffect(() => {
    sendrequest(dataArray);
  }, [dataArray]);

  const sendrequest = async (dataArray: dataType[]) => {
    const lastObject = dataArray[dataArray.length - 1];
    const speed = location?.current?.coords.speed;
    const coordinate = JSON.stringify({
      latitude: location?.current?.coords.latitude,
      longitude: location?.current?.coords.longitude,
    });
    if (hardCodedSpeed || (speed && speed > 1.5)) {
      const form = new FormData();
      form.append("speed", hardCodedSpeed || speed!.toString());
      form.append("accX", lastObject.accX?.toString() as string);
      form.append("accY", lastObject.accY?.toString() as string);
      form.append("accZ", lastObject.accZ?.toString() as string);
      form.append("gyroX", lastObject.gyroX?.toString() as string);
      form.append("gyroY", lastObject.gyroX?.toString() as string);
      form.append("gyroZ", lastObject.gyroX?.toString() as string);
      form.append("coordinate", coordinate);
      fetch(`${databaseUrl}/quality`, {
        method: "POST",
        body: form,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.value == 1) {
            Toast.show("pothole", {
              duration: 300,
              position: Toast.positions.TOP + 100,
              backgroundColor: "green",
            });
          } else {
            Toast.show("no", {
              duration: 300,
              position: Toast.positions.BOTTOM - 30,
            });
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          Toast.show(error.message, {
            duration: 300,
          });
        });
    }
  };

  if (!permission.acc || !permission.gyro) {
    // Camera permissions are not granted yet
    return (
      <View className="flex-1 justify-center">
        <Text style={{ textAlign: "center" }}>
          We need your permission to download the virus
        </Text>
        <Button onPress={() => requestpermission()} title="grant permission" />
      </View>
    );
  }

  return (
    <>
      <View className="flex-1 items-center justify-center">
        <Text>Quality Stream</Text>
        <TouchableOpacity
          className="my-1 p-3 bg-gray-200 rounded-md"
          onPress={() => setShowChart((prev) => !prev)}
        >
          <Text>{showChart ? "Hide" : "Show"} Chart</Text>
        </TouchableOpacity>
        {showChart && (
          <>
            <Text className="">Gyro Graph</Text>
            {/* @ts-ignore */}
            <Chart
              style={{ height: 150, width: 350 }}
              padding={{ left: 30, bottom: 20, right: 10, top: 20 }}
              xDomain={{ min: 1, max: 5 }}
              yDomain={{ min: -3, max: 3 }}
            >
              <VerticalAxis
                tickCount={5}
                theme={{ labels: { formatter: (v) => v.toFixed(2) } }}
              />
              <HorizontalAxis tickCount={2} />
              <Line
                smoothing="bezier"
                tension={0.3}
                theme={{
                  stroke: { color: "#45fc03", width: 2 },
                  scatter: { default: { width: 4, height: 4, rx: 2 } },
                }}
                data={dataArray.map((eachMeasurement, index) => ({
                  x: index + 1,
                  y: eachMeasurement.gyroX || 0,
                }))}
              />
              <Line
                smoothing="bezier"
                tension={0.3}
                theme={{
                  stroke: { color: "#0330fc", width: 2 },
                  scatter: { default: { width: 4, height: 4, rx: 2 } },
                }}
                data={dataArray.map((eachMeasurement, index) => ({
                  x: index + 1,
                  y: eachMeasurement.gyroY || 0,
                }))}
              />
              <Line
                smoothing="bezier"
                tension={0.3}
                theme={{
                  stroke: { color: "#fc0335", width: 2 },
                  scatter: { default: { width: 4, height: 4, rx: 2 } },
                }}
                data={dataArray.map((eachMeasurement, index) => ({
                  x: index + 1,
                  y: eachMeasurement.gyroZ || 0,
                }))}
              />
            </Chart>
            <Text className="">Acc Graph</Text>
            {/* @ts-ignore */}
            <Chart
              style={{ height: 150, width: 350 }}
              padding={{ left: 30, bottom: 20, right: 10, top: 20 }}
              xDomain={{ min: 1, max: 5 }}
              yDomain={{ min: -3, max: 3 }}
            >
              <VerticalAxis
                tickCount={5}
                theme={{ labels: { formatter: (v) => v.toFixed(2) } }}
              />
              <HorizontalAxis tickCount={2} />
              <Line
                smoothing="bezier"
                tension={0.3}
                theme={{
                  stroke: { color: "#45fc03", width: 2 },
                  scatter: { default: { width: 4, height: 4, rx: 2 } },
                }}
                data={dataArray.map((eachMeasurement, index) => ({
                  x: index + 1,
                  y: eachMeasurement.accX || 0,
                }))}
              />
              <Line
                smoothing="bezier"
                tension={0.3}
                theme={{
                  stroke: { color: "#0330fc", width: 2 },
                  scatter: { default: { width: 4, height: 4, rx: 2 } },
                }}
                data={dataArray.map((eachMeasurement, index) => ({
                  x: index + 1,
                  y: eachMeasurement.accY || 0,
                }))}
              />
              <Line
                smoothing="bezier"
                tension={0.3}
                theme={{
                  stroke: { color: "#fc0335", width: 2 },
                  scatter: { default: { width: 4, height: 4, rx: 2 } },
                }}
                data={dataArray.map((eachMeasurement, index) => ({
                  x: index + 1,
                  y: eachMeasurement.accZ || 0,
                }))}
              />
            </Chart>
          </>
        )}
        <View className="items-center">
          <TouchableOpacity
            onPress={() => {
              toggleSensorsSubscription();
              toggleLocationSubscription();
            }}
          >
            <Text
              className={`text-lg p-2 px-4 bg-gray-300 rounded-md font-bold ${
                isRunning ? "text-green-600" : "text-red-600"
              }`}
            >
              {isRunning ? "On" : "Off"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              _slow();
            }}
          >
            <Text className={`text-lg mt-2 ${!isFast && "font-bold"}`}>
              Slow
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              _fast();
            }}
          >
            <Text className={`text-lg mt-2 ${isFast && "font-bold"} `}>
              Fast
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View className=" items-center mb-2">
        <Text className=" text-xs font-semibold text-red-500">
          if the speed lessthan 1.5 m/s request wont be sent
        </Text>
        <Text className=" text-xs font-semibold text-red-500">
          so hard code it if you are stationary
        </Text>
        <TextInput
          placeholder="hardcode"
          inputMode="numeric"
          maxLength={5}
          textAlign="center"
          className="bg-gray-200 text-gray-500 w-2/3 font-xs"
          value={hardCodedSpeed}
          onChangeText={(text) => setHardCodedSpeed(text)}
        />
      </View>
    </>
  );
}

export default qualityStreamComponent;
