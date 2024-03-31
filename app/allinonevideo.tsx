import { Stack } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useSensorsUpdate, { dataType } from "../hooks/useSensorsUpdate";
import useLocationUpdate, { locationThing } from "../hooks/useLocationUpdate";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Camera, CameraType, VideoQuality } from "expo-camera";
import { ResizeMode, Video } from "expo-av";

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
  | "RECORDING_VIDEO"
  | "UPLOADING_DATA_S3"
  | "UPLOADING_DATA_SQS";

type finalDataType = {
  timeStamp: number;
  location: {
    lat: number | undefined | null;
    lng: number | undefined | null;
  };
  speed: number | undefined | null;
  gyroX: number | undefined | null;
  gyroY: number | undefined | null;
  gyroZ: number | undefined | null;
  accX: number | undefined | null;
  accY: number | undefined | null;
  accZ: number | undefined | null;
};

function Allinone() {
  // INSTANCES
  const credConfig = {
    region: process.env.EXPO_PUBLIC_AWS_region as string,
    credentials: {
      accessKeyId: process.env.EXPO_PUBLIC_AWS_accessKeyId as string,
      secretAccessKey: process.env.EXPO_PUBLIC_AWS_secretAccessKey as string,
    },
  };
  const sqsClient = new SQSClient(credConfig);
  const s3Client = new S3Client(credConfig);

  // HOOKS
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

  // STATES
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | undefined>();
  const [tempUri, setTempUri] = useState<string>("");
  const [cameraHasPermission, setCameraHasPermission] =
    useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<"DONTKNOW" | "UP" | "DOWN">(
    "DONTKNOW"
  );
  const [expandVideo, setExpandVideo] = useState<boolean>(false);
  const [currentStreamState, setCurrentStreamState] = useState<
    streamStatetypes[]
  >(["IDLE"]);
  const [finalDataArray, setFinalDataArray] = useState<finalDataType[]>([]);

  // REFS
  const cameraRef = useRef<Camera | null>(null);
  const locationRef = useRef<locationThing>(location);
  const sensorData = useRef<dataType>(dataArray[0]);
  const flatListRef = useRef<FlatList<string>>(null);
  const streamStartTime = useRef<Date | undefined>();

  const scrollFlatList = () => {
    if (flatListRef.current) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  const uploadS3andSQS = async (uri: string) => {
    const videoExt = uri.split(".").pop();
    const videoMime = `video/${videoExt}`;
    let video = await fetch(uri);
    let videoBLob = await video.blob();
    const videoData = new File([videoBLob], `photo.${videoExt}`);
    const fileName = `videos/${new Date().getTime()}.${videoExt}`;
    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: videoData,
      ContentType: videoMime,
    };
    let fileUrl: undefined | string = undefined;
    try {
      appendStreamState("UPLOADING_DATA_S3");
      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
      console.log("VIDEO successfully uploaded");
      fileUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${fileName}`;
    } catch (err) {
      console.log("ERROR WHILE UPLOADING TO S3 : ", err);
    }
    if (!fileUrl) return;
    const sqsMessage = {
      data: finalDataArray,
      videoUrl: fileUrl,
    };
    const input = {
      QueueUrl: "https://sqs.ap-south-1.amazonaws.com/867190329008/myqueue",
      MessageBody: JSON.stringify(sqsMessage),
      DelaySeconds: 0,
    };
    try {
      appendStreamState("UPLOADING_DATA_SQS");
      const command = new SendMessageCommand(input);
      const response = await sqsClient.send(command);
      console.log("Pushed in sqs");
    } catch (err) {
      console.log("ERROR IS : ", err);
    }
  };

  const handleRecording = async (param: number) => {
    console.log(param);
    if (!cameraRef.current) return;
    if (param == 1) {
      appendStreamState("RECORDING_VIDEO");
      console.log("started recording");
      cameraRef.current
        .recordAsync({
          mute: true,
          quality: VideoQuality["480p"],
        })
        .then((uri) => {
          console.log("URI IS ", uri);
          setTempUri(uri.uri);
          uploadS3andSQS(uri.uri);
        })
        .catch((error) => console.log("error while recording"));
    } else {
      console.log("STOPPED");
      cameraRef.current.stopRecording();
    }
  };

  const appendArray = () => {
    const currentTime = new Date();
    const timeDifference = Math.floor(
      // @ts-ignore
      (currentTime - streamStartTime.current) / 1000
    );
    console.log(streamStartTime.current, timeDifference, currentTime);
    setFinalDataArray((prev) => [
      ...prev,
      {
        timeStamp: timeDifference,
        location: {
          lat: locationRef.current.current?.coords?.latitude,
          lng: locationRef.current.current?.coords?.longitude,
        },
        speed: locationRef.current.current?.coords?.speed,
        gyroX: sensorData.current.gyroX,
        gyroY: sensorData.current.gyroY,
        gyroZ: sensorData.current.gyroZ,
        accX: sensorData.current.accX,
        accY: sensorData.current.accY,
        accZ: sensorData.current.accZ,
      },
    ]);
  };

  const appendStreamState = (state: streamStatetypes) => {
    console.log(state);
    setCurrentStreamState((prev) => [...prev, state]);
  };

  const toggleStream = () => {
    toggleSensorsSubscription();
    toggleLocationSubscription();
    if (locationRunning && sensorRunning) {
      clearInterval(intervalId);
      handleRecording(0);
      console.log(finalDataArray);
      setServerStatus("DONTKNOW");
    } else {
      streamStartTime.current = new Date();
      handleRecording(1);
      const id = setInterval(() => {
        appendArray();
      }, 1000);
      setIntervalId(id);
    }
  };

  const toggleExpandVideo = () => {
    setExpandVideo((prev) => !prev);
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

  useEffect(() => {
    scrollFlatList();
  }, [currentStreamState]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-stone-50 p-1">
        {!expandVideo && (
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
        )}

        {/* bottom pannel */}
        <View
          className={`flex ${
            expandVideo ? "flex-col" : "flex-row"
          }   justify-between items-center`}
        >
          <TouchableOpacity
            onPress={toggleExpandVideo}
            className={`
                bg-gray-500
                 ${expandVideo ? "h-96 w-56" : "h-28 w-16"}`}
          >
            <Video
              style={{
                height: "100%",
                width: "100%",
              }}
              resizeMode={ResizeMode.CONTAIN}
              source={{
                uri: tempUri,
              }}
              rate={1.0}
              volume={1.0}
              isMuted={false}
              useNativeControls
              shouldPlay
              isLooping
            />
          </TouchableOpacity>
          {!expandVideo && (
            <TouchableOpacity
              onPress={toggleStream}
              //   onPress={() => handleRecording(1)}
              className={`flex-row p-2 px-3 border  ${
                !(sensorRunning && locationRunning)
                  ? "border-blue-500 bg-blue-400"
                  : "border-red-500 bg-red-400"
              }  rounded-md `}
            >
              <Text className="text-white text-sm">
                {!(sensorRunning && locationRunning) ? "Start" : "Stop"}
              </Text>
            </TouchableOpacity>
          )}

          <Camera
            className={`
            bg-gray-500
             ${expandVideo ? "h-96 w-56" : "h-28 w-16"}`}
            type={CameraType.back}
            ref={cameraRef}
          ></Camera>

          {expandVideo && (
            <TouchableOpacity
              //   onPress={toggleStream}
              onPress={() => handleRecording(1)}
              className={`flex-row p-2 px-3 border mt-2  ${
                !(sensorRunning && locationRunning)
                  ? "border-blue-500 bg-blue-400"
                  : "border-red-500 bg-red-400"
              }  rounded-md `}
            >
              <Text className="text-white text-sm">
                {!(sensorRunning && locationRunning) ? "Start" : "Stop"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

export default Allinone;
