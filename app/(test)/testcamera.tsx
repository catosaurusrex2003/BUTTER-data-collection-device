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
import { selectUrl } from "../../slices/databaseUrlSlice";
import { useSelector } from "react-redux";
import useLocationUpdate from "../../hooks/useLocationUpdate";
const rizz = require("../../assets/rizz.jpg");
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import "react-native-url-polyfill/auto";
import "react-native-get-random-values";
import { Stack, Tabs } from "expo-router";

// BUG
// first render the location is undefined for some time

export default function CameraComponent() {
  const credConfig = {
    region: process.env.EXPO_PUBLIC_AWS_region as string,
    credentials: {
      accessKeyId: process.env.EXPO_PUBLIC_AWS_accessKeyId as string,
      secretAccessKey: process.env.EXPO_PUBLIC_AWS_secretAccessKey as string,
    },
  };
  const sqsClient = new SQSClient(credConfig);
  const s3Client = new S3Client(credConfig);
  const [type, setType] = useState<CameraType>(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const cameraRef = useRef<Camera | null>(null);
  const [base64, setBase64] = useState<string>();
  const [imageOpen, setImageOpen] = useState<boolean>(false);
  const databaseUrl = useSelector(selectUrl);
  const [picSize, setPicSize] = useState<string | null>(null);

  const bucketName = process.env.EXPO_PUBLIC_AWS_bucketName;
  const bucketRegion = process.env.EXPO_PUBLIC_AWS_bucketRegion;

  const { location, updateLocation } = useLocationUpdate();

  function toggleCameraType() {
    setType((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  }

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
        latitude: location.current?.coords.latitude,
        longitude: location.current?.coords.longitude,
      },
      imageUrl: imageUrl,
      returnType: "image (i dont know why this was  written)",
      returnFormat: "base64 (i dont know why this was  written)",
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

  const getBase64String = async (uri: string) => {
    const string = await readAsStringAsync(uri, {
      encoding: EncodingType.Base64,
    });
    return string;
  };

  const takePicture = async () => {
    updateLocation();
    console.log("taking picture");
    if (cameraRef.current) {
      const { uri } = await cameraRef.current.takePictureAsync();
      if (uri) {
        try {
          const imageUrl = await uploadS3(uri);
          if (imageUrl) await pushInSQS(imageUrl);
          else console.log("Failed to push data in S3");
        } catch (err) {
          console.log("error founded ", err);
        }
      }
    }
  };

  useEffect(() => {
    updateLocation();
  }, []);

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View className="flex-1 justify-center">
        <Text style={{ textAlign: "center" }}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }
  return (
    <View className="flex-1 justify-center">
      <Stack.Screen
        options={{ headerShown: false, navigationBarHidden: true }}
      />
      <Tabs.Screen options={{ headerShown: false }} />
      <Camera
        className=" w-full h-5/6"
        type={type}
        ref={cameraRef}
        // pictureSize={picSize || "320x240"}
        // autoFocus={false}
      >
        <View className="flex-1 items-center justify-end bg-transparent m-5">
          {type == CameraType.front && (
            <Image className=" h-20 w-20  mb-4" source={rizz} />
          )}
          <TouchableOpacity
            className="h-16 w-16 rounded-full bg-white"
            onPress={takePicture}
          ></TouchableOpacity>
          <View className="flex flex-row w-full justify-between items-center">
            {base64 && (
              <TouchableOpacity
                className="border-2 border-white"
                onPress={() => {
                  setImageOpen((prev) => !prev);
                }}
              >
                <Image
                  className={`${imageOpen ? "h-80 w-80" : "h-12 w-12"}`}
                  source={{ uri: `data:image/png;base64,${base64}` }}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity className="ml-auto " onPress={toggleCameraType}>
              <Text className=" text-md font-bold bg-black px-2 py-1 rounded-md text-white">
                {type == CameraType.front ? "back camera" : "front camera"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Camera>
    </View>
  );
}

// const sendrequest = async (base64string: string) => {
//   console.log(location?.current?.coords.latitude);
//   console.log(location?.current?.coords.longitude);
//   if (base64string) {
//     const form = new FormData();
//     form.append(
//       "coordinate",
//       JSON.stringify({
//         latitude: location?.current?.coords.latitude || 5,
//         longitude: location?.current?.coords.latitude || 5,
//       })
//     );
//     form.append("base64str", base64string);
//     form.append("returnType", "image");
//     form.append("returnFormat", "base64");
//     Toast.show("sending. Please dont spam", {
//       duration: 1000,
//     });
//     fetch(`${databaseUrl}/predict`, {
//       method: "POST",
//       body: form,
//     })
//       .then((response) => response.text())
//       .then((textData) => {
//         setBase64(textData);
//         Toast.show("Recieved Image", {
//           duration: 500,
//         });
//       })
//       .catch((error) => {
//         console.error("Error:", error);
//         Toast.show(error.message, {
//           duration: 300,
//         });
//       });
//   }
// };

// const generateSignedUrl = async (objectKey: string) => {
//   try {
//     const command = new GetObjectCommand({
//       Bucket: bucketName,
//       Key: objectKey,
//     });
//     const expiresIn = 60 * 60; //1 hour
//     const signedUrl = await getSignedUrl(s3Client, command, {
//       expiresIn,
//     });
//     console.log("Signed URL:", signedUrl);
//     return signedUrl;
//   } catch (error) {
//     console.error("Error generating signed URL:", error);
//     throw error;
//   }
// };
