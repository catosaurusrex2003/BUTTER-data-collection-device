import { Camera, CameraType } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EncodingType, readAsStringAsync } from "expo-file-system";
import Toast from "react-native-root-toast";
import { selectUrl } from "../slices/databaseUrlSlice";
import { useSelector } from "react-redux";
import useLocationUpdate from "../hooks/useLocationUpdate";
const rizz = require("../assets/rizz.jpg");

export default function CameraComponent() {
  const [type, setType] = useState<CameraType>(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const cameraRef = useRef<Camera | null>(null);
  const [isstreaming, setIsstreaming] = useState<boolean>(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout>();
  const databaseUrl = useSelector(selectUrl);

  const {
    location,
    toggleLocationSubscription,
    locationUpdateSubscription,
    updateLocation,
    locationErrorMsg,
  } = useLocationUpdate(5000);

  function toggleCameraType() {
    setType((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  }
  const sendrequest = async (base64string: string) => {
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
        sendrequest(base64string);
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

  useEffect(() => {
    updateLocation()
  }, [])
  

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
    <View className="flex-1 justify-center">
      <Camera
        className=" w-full h-5/6"
        type={type}
        ref={cameraRef}
        // pictureSize="320x240"
        // autoFocus={false}
      >
        <View className="flex-1 items-center justify-end bg-transparent m-5">
          {type == CameraType.front && (
            <Image className=" h-20 w-20  mb-4" source={rizz} />
          )}
          <TouchableOpacity
            className="my-5 bg-white p-3 rounded-md"
            onPress={handleStream}
          >
            <Text>{isstreaming ? "Stop Stream" : "Stream"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="h-16 w-16 rounded-full bg-white"
            onPress={takePicture}
          ></TouchableOpacity>
          <View className="flex flex-row w-full justify-between items-center">
            {/* {uri && (
              <TouchableOpacity
                onPress={() => {
                  setImageOpen((prev) => !prev);
                }}
              >
                <Image
                  className={`${imageOpen ? "h-80 w-80" : "h-12 w-12"}`}
                  source={{ uri: uri }}
                />
              </TouchableOpacity>
            )} */}
            <TouchableOpacity className="ml-auto " onPress={toggleCameraType}>
              <Text className=" text-md font-bold bg-black px-2 py-1 rounded-md text-white">
                {type == CameraType.front ? "back camera" : "front camera"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Camera>
      {locationErrorMsg && (
        <Text className="text-red-500 ">{locationErrorMsg}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({});
