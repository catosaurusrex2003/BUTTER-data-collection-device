import { Stack } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useSensorsUpdate, { dataType } from "../hooks/useSensorsUpdate";
import useLocationUpdate, { locationThing } from "../hooks/useLocationUpdate";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Camera, CameraType } from "expo-camera";

// without below lines this shit fails
import "react-native-url-polyfill/auto";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
// dont remove the upper 3 lines. this shit is necessary for everything to work.
// https://github.com/uuidjs/uuid#getrandomvalues-not-supported

const bucketName = process.env.EXPO_PUBLIC_AWS_bucketName;
const bucketRegion = process.env.EXPO_PUBLIC_AWS_bucketRegion;

type streamStatetypes =
  | "IDLE"
  | "CAPTURING_DATA"
  | "UPLOADING_DATA_S3"
  | "UPLOADING_DATA_SQS";

function Allinone() {
  const credConfig = {
    region: process.env.EXPO_PUBLIC_AWS_region as string,
    credentials: {
      accessKeyId: process.env.EXPO_PUBLIC_AWS_accessKeyId as string,
      secretAccessKey: process.env.EXPO_PUBLIC_AWS_secretAccessKey as string,
    },
  };
  const sqsClient = new SQSClient(credConfig);
  const s3Client = new S3Client(credConfig);
  const {
    isRunning: sensorRunning,
    dataArray,
    toggleSensorsSubscription,
  } = useSensorsUpdate({
    intervalObj: { slow: 2000, fast: 1000 },
    keeptrack: false,
  });
  const {
    isRunning: locationRunning,
    location,
    toggleLocationSubscription,
    permissionStatus,
  } = useLocationUpdate(2000, 0);

  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | undefined>();
  const [tempUri, setTempUri] = useState<string | undefined>();
  const [cameraHasPermission, setCameraHasPermission] =
    useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<"DONTKNOW" | "UP" | "DOWN">(
    "DONTKNOW"
  );
  const [expandImage, setExpandImage] = useState<boolean>(false);
  const [currentStreamState, setCurrentStreamState] = useState<
    streamStatetypes[]
  >(["IDLE"]);

  const cameraRef = useRef<Camera | null>(null);
  const locationRef = useRef<locationThing>(location);
  const sensorData = useRef<dataType>(dataArray[0]);
  const flatListRef = useRef<FlatList<string>>(null);

  const scrollFlatList = () => {
    if (flatListRef.current) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  const takePicture = async () => {
    console.log("taking picture");
    if (cameraRef.current) {
      const { uri } = await cameraRef.current.takePictureAsync();
      return uri;
    }
  };

  const uploadS3 = async (uri: string): Promise<string | undefined> => {
    const imageExt = uri.split(".").pop();
    const imageMime = `image/${imageExt}`;
    let picture = await fetch(uri);
    let pictureBLob = await picture.blob();
    const imageData = new File([pictureBLob], `photo.${imageExt}`);
    const fileName = `images/${new Date().getTime()}.jpg`;
    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: imageData,
      ContentType: imageMime,
    };
    try {
      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
      console.log("Image successfully uploaded");
      const fileUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${fileName}`;
      return fileUrl;
    } catch (err) {
      console.log("ERROR WHILE UPLOADING TO S3 : ", err);
      return;
    }
  };

  const pushInSQS = async (imageUrl: string) => {
    const sqsMessage = {
      coordinate: {
        latitude: locationRef.current.current?.coords.latitude,
        longitude: locationRef.current.current?.coords.longitude,
      },
      speed: location.current?.coords.speed,
      gyro: {
        gyroX: sensorData.current?.gyroX,
        gyroY: sensorData.current?.gyroY,
        gyroZ: sensorData.current?.gyroZ,
      },
      acc: {
        accX: sensorData.current?.accX,
        accY: sensorData.current?.accY,
        accZ: sensorData.current?.accZ,
      },
      imageUrl: imageUrl,
    };
    const input = {
      QueueUrl: "https://sqs.ap-south-1.amazonaws.com/867190329008/myqueue",
      MessageBody: JSON.stringify(sqsMessage),
      DelaySeconds: 0,
    };
    try {
      const command = new SendMessageCommand(input);
      const response = await sqsClient.send(command);
      console.log("Pushed in sqs");
    } catch (err) {
      console.log("ERROR IS : ", err);
    }
  };

  const handleEachStreamEvent = async () => {
    try {
      setCurrentStreamState((prev) => [...prev, "CAPTURING_DATA"]);
      scrollFlatList();
      const uri = await takePicture();
      if (!uri) return;
      setTempUri(uri);
      setCurrentStreamState((prev) => [...prev, "UPLOADING_DATA_S3"]);
      scrollFlatList();
      const url = await uploadS3(uri);
      if (!url) return;
      setCurrentStreamState((prev) => [...prev, "UPLOADING_DATA_SQS"]);
      scrollFlatList();
      await pushInSQS(url);
      setServerStatus("UP");
      setCurrentStreamState((prev) => [...prev, "IDLE"]);
      scrollFlatList();
    } catch (error) {
      setServerStatus("DOWN");
      console.log(error);
    }
  };

  const toggleStream = () => {
    toggleSensorsSubscription();
    toggleLocationSubscription();
    if (locationRunning && sensorRunning) {
      clearInterval(intervalId);
      setServerStatus("DONTKNOW");
    } else {
      const id = setInterval(() => {
        handleEachStreamEvent();
      }, 2000);
      setIntervalId(id);
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraHasPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    sensorData.current = dataArray[0];
  }, [dataArray]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-stone-50 p-1">
        <View className="flex-1 justify-center">
          {/* location */}
          <View className="flex flex-row flex-wrap justify-center mb-1">
            <View className="flex-row gap-2 w-1/2 justify-center my-1">
              <View className="flex-row justify-between items-center w-5/6 p-4 bg-gray-100  border-[0.5px] border-stone-200 rounded-md">
                <Text className=" text-base ">lat :</Text>
                <Text className=" text-base ">
                  {location.current?.coords.latitude}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-2 w-1/2 justify-center my-1">
              <View className="flex-row justify-between items-center w-5/6 p-4 bg-gray-100  border-[0.5px] border-stone-200 rounded-md">
                <Text className=" text-base ">long :</Text>
                <Text className=" text-base ">
                  {location.current?.coords.longitude}
                </Text>
              </View>
            </View>
          </View>
          {/* gyro */}
          <View className="flex flex-row flex-wrap justify-center mb-1">
            <View className="flex-row gap-2 w-1/2 justify-center mt-1">
              <View className="flex-row justify-between items-center w-5/6 p-4 bg-gray-100  border-[0.5px] border-stone-200 rounded-md">
                <Text className=" text-base ">gyroX :</Text>
                <Text className=" text-base ">{dataArray[0].gyroX}</Text>
              </View>
            </View>
            <View className="flex-row gap-2 w-1/2 justify-center mt-1">
              <View className="flex-row justify-between items-center w-5/6 p-4 bg-gray-100  border-[0.5px] border-stone-200 rounded-md">
                <Text className=" text-base ">gyroY :</Text>
                <Text className=" text-base ">{dataArray[0].gyroY}</Text>
              </View>
            </View>
            <View className="flex-row gap-2 w-1/2 justify-center mt-1">
              <View className="flex-row justify-between items-center w-5/6 p-4 bg-gray-100  border-[0.5px] border-stone-200 rounded-md">
                <Text className=" text-base ">gyroZ :</Text>
                <Text className=" text-base ">{dataArray[0].gyroZ}</Text>
              </View>
            </View>
          </View>
          {/* acc */}
          <View className="flex flex-row flex-wrap justify-center mb-3">
            <View className="flex-row gap-2 w-1/2 justify-center mt-1">
              <View className="flex-row justify-between items-center w-5/6 p-4 bg-gray-100  border-[0.5px] border-stone-200 rounded-md">
                <Text className=" text-base ">accX :</Text>
                <Text className=" text-base ">{dataArray[0].accX}</Text>
              </View>
            </View>
            <View className="flex-row gap-2 w-1/2 justify-center mt-1">
              <View className="flex-row justify-between items-center w-5/6 p-4 bg-gray-100  border-[0.5px] border-stone-200 rounded-md">
                <Text className=" text-base ">accY :</Text>
                <Text className=" text-base ">{dataArray[0].accY}</Text>
              </View>
            </View>
            <View className="flex-row gap-2 w-1/2 justify-center mt-1">
              <View className="flex-row justify-between items-center w-5/6 p-4 bg-gray-100  border-[0.5px] border-stone-200 rounded-md">
                <Text className=" text-base ">accZ :</Text>
                <Text className=" text-base ">{dataArray[0].accZ}</Text>
              </View>
            </View>
          </View>
          {/* speed */}
          <View className="flex flex-row flex-wrap justify-center mb-3">
            <View className="flex-row gap-2 w-1/2 justify-center">
              <View className="flex-row justify-between items-center w-5/6 p-4 bg-gray-100  border-[0.5px] border-stone-200 rounded-md">
                <Text className=" text-base ">speed :</Text>
                <Text className=" text-base ">
                  {Number(location.current?.coords.speed?.toFixed(7))}
                </Text>
              </View>
            </View>
          </View>
          {/* frame rate */}
          <View className="flex-row gap-2 justify-center mb-4">
            <View className="flex-row justify-between items-center px-4">
              <Text className=" text-sm text-gray-600">interval : </Text>
              <Text className=" text-sm text-gray-600">2000ms</Text>
            </View>
          </View>
          {/* STREAM STATES */}
          <View className="flex-row gap-2 justify-center h-20 mb-3">
            {/* <ScrollView className="flex-col px-4 h-5">
              {currentStreamState.map((eachStatusUpdate) => (
                <Text className="text-sm text-gray-600">
                  {eachStatusUpdate}
                </Text>
              ))}
            </ScrollView> */}
            <FlatList
              ref={flatListRef}
              data={currentStreamState}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <Text className="text-sm text-gray-600">{item}</Text>
              )}
            />
          </View>
          {/* statistics */}
          <View className="flex flex-row flex-wrap justify-center">
            <View className="flex-row gap-2 justify-between items-center w-1/2 my-1 px-5">
              <Text className=" text-xs ">camera access :</Text>
              <View
                className={`flex-row justify-between items-center w-4 h-4 ${
                  cameraHasPermission ? "bg-blue-400" : "bg-red-400"
                }  border-[0.5px] border-stone-200 rounded-full`}
              ></View>
            </View>
            <View className="flex-row gap-2 justify-between items-center w-1/2 my-1 px-5">
              <Text className=" text-xs ">location access :</Text>
              <View
                className={`flex-row justify-between items-center w-4 h-4 ${
                  permissionStatus ? "bg-blue-400" : "bg-red-400"
                }  border-[0.5px] border-stone-200 rounded-full`}
              ></View>
            </View>
            <View className="flex-row gap-2 justify-between items-center w-1/2 my-1 px-5">
              <Text className=" text-xs ">stream status :</Text>
              <View
                className={`flex-row justify-between items-center w-4 h-4 ${
                  sensorRunning || locationRunning
                    ? "bg-green-400"
                    : "bg-red-400"
                }   border-[0.5px] border-stone-200 rounded-full`}
              ></View>
            </View>
            <View className="flex-row gap-2 justify-between items-center w-1/2 my-1 px-5">
              <Text className=" text-xs ">server status :</Text>
              <View
                className={`flex-row justify-between items-center w-4 h-4 ${
                  serverStatus == "DONTKNOW"
                    ? "bg-gray-200"
                    : serverStatus == "UP"
                    ? "bg-green-400"
                    : "bg-red-400"
                } border-[0.5px] border-stone-200 rounded-full`}
              ></View>
            </View>
          </View>
        </View>
        {/* bottom pannel */}
        <View className="flex-row justify-between items-center">
          <TouchableOpacity onPress={() => setExpandImage((prev) => !prev)}>
            {tempUri ? (
              <Image
                className={`${expandImage ? "h-52 w-28" : "h-28 w-16"}`}
                source={{ uri: tempUri }}
              />
            ) : (
              <View
                className={`${
                  expandImage ? "h-52 w-28" : "h-28 w-16"
                } bg-gray-500`}
              ></View>
            )}
          </TouchableOpacity>
          <View className="flex-1 flex-row justify-center">
            <TouchableOpacity
              onPress={toggleStream}
              className={`flex-row p-2 px-3 border  ${
                !(sensorRunning && locationRunning)
                  ? "border-blue-500 bg-blue-400"
                  : "border-red-500 bg-red-400"
              }  rounded-md `}
            >
              <Text className="text-white text-sm">
                {!(sensorRunning && locationRunning) ? "Stream" : "Stop"}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-1 flex-row justify-center">
            <TouchableOpacity
              onPress={() => {
                console.log("running");
              }}
              disabled={sensorRunning && locationRunning}
              className={`flex-row p-2 px-3 border ${
                !(sensorRunning && locationRunning)
                  ? "border-blue-500 bg-blue-400"
                  : "bg-gray-400"
              } rounded-md `}
            >
              <Text className="text-white text-sm">Capture Once</Text>
            </TouchableOpacity>
          </View>
          <Camera
            className={`${expandImage ? "h-52 w-28" : "h-28 w-16"} bg-gray-500`}
            type={CameraType.back}
            ref={cameraRef}
          ></Camera>
        </View>
      </SafeAreaView>
    </>
  );
}

export default Allinone;
