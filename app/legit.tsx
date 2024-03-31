import React, { useEffect, useRef, useState } from "react";
import { Camera, CameraType } from "expo-camera";
import { Button, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Accelerometer, Gyroscope } from "expo-sensors";
import Toast from "react-native-root-toast";
import { useSelector } from "react-redux";
import { selectUrl } from "../slices/databaseUrlSlice";
import useSensorsUpdate from "../hooks/useSensorsUpdate";
import useLocationUpdate from "../hooks/useLocationUpdate";
import { EncodingType, readAsStringAsync } from "expo-file-system";

type dataType = {
  speed?: number;
  gyroX?: number;
  gyroY?: number;
  gyroZ?: number;
  accX?: number;
  accY?: number;
  accZ?: number;
};

function Legit() {
  const [allPermission, setAllPermission] = useState({
    acc: false,
    gyro: false,
  });
  const [hardCodedSpeed, setHardCodedSpeed] = useState<string | undefined>(
    undefined
  );
  const [type, setType] = useState<CameraType>(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const cameraRef = useRef<Camera | null>(null);
  const [isstreaming, setIsstreaming] = useState<boolean>(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout>();
  const databaseUrl = useSelector(selectUrl);

  useEffect(() => {
    requestpermission();
  }, []);

  const requestpermission = async () => {
    console.log("requesting permissions");
    const accPermissions = await Accelerometer.requestPermissionsAsync();
    const gyroPermissions = await Gyroscope.requestPermissionsAsync();
    setAllPermission({
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
  const {
    location,
    toggleLocationSubscription,
    locationUpdateSubscription,
    locationErrorMsg,
  } = useLocationUpdate(3000);

  useEffect(() => {
    sendSensorrequest(dataArray);
  }, [dataArray]);

  const sendSensorrequest = async (dataArray: dataType[]) => {
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
      fetch(`${databaseUrl}/pothole`, {
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

  if (!allPermission.acc || !allPermission.gyro) {
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

  function toggleCameraType() {
    setType((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  }
  const sendImagerequest = async (base64string: string) => {
    if (base64string) {
      const form = new FormData();
      // form.append("coordinate", JSON.stringify({ latitude: 5, longitude: -5 }));
      form.append(
        "coordinate",
        JSON.stringify({
          latitude: location.current?.coords.latitude || 5,
          longitude: location.current?.coords.longitude || -5,
        })
      );
      form.append("base64str", base64string);
      fetch(`${databaseUrl}/asyncpredict`, {
        method: "POST",
        body: form,
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Response:", data.message);
          Toast.show("recieved by server", {
            duration: 80,
          });
        })
        .catch((error) => {
          console.error("Error:", error);
          Toast.show(error.message, {
            duration: 300,
          });
        });
    }
  };

  const getBase64String = async (uri: string) => {
    const string = await readAsStringAsync(uri, {
      encoding: EncodingType.Base64,
    });
    return string;
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      // const availableratios = await cameraRef.current.getSupportedRatiosAsync()
      // const availablesizes = await cameraRef.current.getAvailablePictureSizesAsync("4:3");
      const { uri } = await cameraRef.current.takePictureAsync();
      if (uri) {
        const base64string = await getBase64String(uri);
        Toast.show("clicked", { duration: 80 });
        console.log("clicked");
        sendImagerequest(base64string);
      }
    }
  };

  const handleStream = () => {
    if (isstreaming) {
      clearInterval(intervalId);
      if (locationUpdateSubscription) {
        toggleLocationSubscription();
      }
      setIsstreaming(false);
    } else {
      setIsstreaming(true);
      if (!locationUpdateSubscription) {
        toggleLocationSubscription();
      }
      const id = setInterval(() => {
        console.log("clicking"); //if i remove this console.log the code doesnt work WEIRD
        takePicture();
      }, 2000);
      setIntervalId(id);
    }
  };

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View className="flex-1 justify-center">
        <Text style={{ textAlign: "center" }}>Allow camera 😇</Text>
        <Button onPress={requestPermission} title="Press Me" />
      </View>
    );
  }

  return (
    <>
      <View className="flex-1 items-center justify-center">
        <Text>Pothole Stream</Text>
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
      <Camera
        className=" w-full h-5/6 hidden"
        type={type}
        ref={cameraRef}
      ></Camera>
      {locationErrorMsg && (
        <Text className="text-red-500 ">{locationErrorMsg}</Text>
      )}
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

export default Legit;
