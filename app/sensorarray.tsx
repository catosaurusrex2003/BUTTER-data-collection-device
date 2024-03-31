import { Stack } from "expo-router";
import * as Location from "expo-location";
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

// without below lines this shit fails
import "react-native-url-polyfill/auto";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { TextInput } from "react-native-gesture-handler";
// dont remove the upper 3 lines. this shit is necessary for everything to work.
// https://github.com/uuidjs/uuid#getrandomvalues-not-supported

const bucketName = process.env.EXPO_PUBLIC_AWS_bucketName;
const bucketRegion = process.env.EXPO_PUBLIC_AWS_bucketRegion;

type allDataUnitType = {
  location: Location.LocationObjectCoords;
  sensors: dataType;
  potholeFound: boolean;
};

function SensorArray() {
  // INSTANCES
  const credConfig = {
    region: process.env.EXPO_PUBLIC_AWS_region as string,
    credentials: {
      accessKeyId: process.env.EXPO_PUBLIC_AWS_accessKeyId as string,
      secretAccessKey: process.env.EXPO_PUBLIC_AWS_secretAccessKey as string,
    },
  };
  const s3Client = new S3Client(credConfig);

  // HOOKS
  const {
    isRunning: sensorRunning,
    dataArray,
    toggleSensorsSubscription,
  } = useSensorsUpdate({
    intervalObj: { slow: 1000, fast: 200 },
    keeptrack: false,
  });
  const {
    isRunning: locationRunning,
    location,
    toggleLocationSubscription,
    permissionStatus,
  } = useLocationUpdate(200, 0);

  // STATES
  const [allDataArray, setAllDataArray] = useState<allDataUnitType[]>([]);
  const [onPothole, setOnPothole] = useState<boolean>(false);
  const [commitMessage, setCommitMessage] = useState<string | undefined>(
    undefined
  );
  const [messages, setMessages] = useState<string[]>([]);

  // REFS
  const flatListRef = useRef<FlatList<string>>(null);

  const scrollFlatList = () => {
    if (flatListRef.current) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  const uploadToS3 = async () => {
    if (!commitMessage) {
      setMessages((prev) => [...prev, "COMMIT MESSAGE NECESSARY"]);
      return;
    }
    const currentDate = new Date();
    const timeString = `${currentDate.toTimeString()}-${currentDate.toDateString()}`;
    const myObject = {
      message: commitMessage,
      time: timeString,
      data: allDataArray,
    };

    const jsonString = JSON.stringify(myObject);

    const fileName = `jsons/${timeString}.json`;

    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: jsonString,
      ContentType: "application/json",
    };
    try {
      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);
      setMessages((prev) => [...prev, "Uploaded To s3"]);
      const fileUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${fileName}`;
      setMessages((prev) => [...prev, fileUrl]);
      setCommitMessage(undefined);
    } catch (err) {
      setMessages((prev) => [...prev, "error while uploading to s3"]);
      setMessages((prev) => [...prev, JSON.stringify(err)]);
    }
  };

  const toggleStream = () => {
    toggleSensorsSubscription();
    toggleLocationSubscription();
    // if (locationRunning && sensorRunning) {
    // UPLOAD THE ARRAy
    // }
  };

  useEffect(() => {
    setAllDataArray((prev) => {
      if (!location?.current?.coords || !dataArray[0]) return prev;
      return [
        ...prev,
        {
          location: location?.current?.coords,
          sensors: dataArray[0],
          potholeFound: onPothole,
        },
      ];
    });
    scrollFlatList();
  }, [dataArray]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-stone-50 p-1">
        <View className="flex-1 justify-evenly">
          {/* location */}
          {/* <View className="flex flex-row flex-wrap justify-center mb-1">
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
          </View> */}
          {/* gyro */}
          {/* <View className="flex flex-row flex-wrap justify-center mb-1">
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
          </View> */}
          {/* acc */}
          {/* <View className="flex flex-row flex-wrap justify-center mb-3">
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
          </View> */}
          {/* speed */}
          {/* <View className="flex flex-row flex-wrap justify-center mb-3">
            <View className="flex-row gap-2 w-1/2 justify-center">
              <View className="flex-row justify-between items-center w-5/6 p-4 bg-gray-100  border-[0.5px] border-stone-200 rounded-md">
                <Text className=" text-base ">speed :</Text>
                <Text className=" text-base ">
                  {Number(location.current?.coords.speed?.toFixed(7))}
                </Text>
              </View>
            </View>
          </View> */}
          {/* frame rate */}
          <View className="flex-row gap-2 justify-center mb-4">
            <View className="flex-row justify-between items-center px-4">
              <Text className=" text-6xl font-semibold text-gray-600">
                {allDataArray.length}
              </Text>
            </View>
          </View>

          {!(sensorRunning && locationRunning) && (
            <View className="flex gap-2 items-center ">
              <FlatList
                className="bg-gray-200 w-full h-40"
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <Text className={`text-sm text-gray-600`}>{item}</Text>
                )}
              />
              <View className="flex-row justify-center items-center mb-5">
                <TouchableOpacity
                  onPress={() => {
                    setMessages([]);
                  }}
                  className={`flex-row p-2 px-3 border border-red-500 bg-red-400 rounded-md `}
                >
                  <Text className="text-white text-sm">Clear Logs</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* statistics */}
          {/* <View className="flex flex-row flex-wrap justify-center">
            <View className="flex-row gap-2 justify-between items-center w-1/2 my-1 px-5">
              <Text className=" text-xs ">location access :</Text>
              <View
                className={`flex-row justify-between items-center w-4 h-4 ${
                  permissionStatus ? "bg-blue-400" : "bg-red-400"
                }  border-[0.5px] border-stone-200 rounded-full`}
              ></View>
            </View>
          </View> */}
        </View>
        <View className="flex-1 justify-evenly">
          <View className="flex-row justify-center items-center mb-5">
            <TouchableOpacity
              onPressIn={() => {
                setOnPothole(true);
              }}
              onPressOut={() => {
                setOnPothole(false);
              }}
              activeOpacity={1}
              className={`flex-row justify-center items-center py-5 w-full rounded-md border ${
                onPothole
                  ? "border-red-600 bg-red-500"
                  : "border-yellow-600 bg-yellow-500"
              }  `}
            >
              <Text className="text-white text-xl">
                {onPothole ? "RELEASE" : "HOLD ON POTHOLE"}
              </Text>
            </TouchableOpacity>
          </View>
          {/* bottom pannel */}
          <View className="flex-row justify-center items-center mb-5">
            <TouchableOpacity
              onPress={toggleStream}
              className={`flex-row p-2 px-3 border  ${
                !(sensorRunning && locationRunning)
                  ? "border-blue-500 bg-blue-400"
                  : "border-red-500 bg-red-400"
              }  rounded-md `}
            >
              <Text className="text-white text-sm">
                {!(sensorRunning && locationRunning)
                  ? "Start Recording"
                  : "Stop"}
              </Text>
            </TouchableOpacity>
          </View>

          {allDataArray.length > 0 && !(sensorRunning && locationRunning) && (
            <View className="flex-col justify-center items-center mb-5 gap-5">
              <TextInput
                className="bg-gray-200 text-lg p-2  rounded-md"
                onChangeText={(value) => setCommitMessage(value)}
                value={commitMessage}
                placeholder="Enter Commit Message..."
              />
              <TouchableOpacity
                onPress={uploadToS3}
                className={`flex-row p-2 px-3 border border-blue-500 bg-blue-400 rounded-md `}
              >
                <Text className="text-white text-sm">Push to Database</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setAllDataArray([]);
                }}
                className={`flex-row p-2 px-3 border border-red-500 bg-red-400 rounded-md `}
              >
                <Text className="text-white text-sm">Clear Array</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

export default SensorArray;
