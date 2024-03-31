import { StyleSheet, Text, TextInput, View } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { TouchableOpacity } from "react-native-gesture-handler";
import Toast from "react-native-root-toast";
import { selectUrl } from "../../slices/databaseUrlSlice";
import { useSelector } from "react-redux";
import useLocationUpdate from "../../hooks/useLocationUpdate";

type dataType = {
  latitude: number;
  longitude: number;
  speed: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  accX: number;
  accY: number;
  accZ: number;
};

const TestPothole = () => {
  const [data, setData] = useState<dataType>({
    latitude: 2.0,
    longitude: 2.0,
    speed: 0,
    gyroX: 0,
    gyroY: 0,
    gyroZ: 0,
    accX: 0,
    accY: 0,
    accZ: 0,
  });
  const [output, setOutput] = useState<number | null>(null);
  const { location, updateLocation } = useLocationUpdate();
  const databaseUrl = useSelector(selectUrl);

  const sendrequest = async () => {
    setOutput(null);
    const coordinate = JSON.stringify({
      latitude: data.latitude,
      longitude: data.longitude,
    });
    console.log("sending request");
    const form = new FormData();
    form.append("coordinate", coordinate);
    form.append("speed", data.speed?.toString() || "5");
    form.append("accX", data.accX?.toString() || "0");
    form.append("accY", data.accY?.toString() || "0");
    form.append("accZ", data.accZ?.toString() || "0");
    form.append("gyroX", data.gyroX?.toString() || "0");
    form.append("gyroY", data.gyroY?.toString() || "0");
    form.append("gyroZ", data.gyroZ?.toString() || "0");
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
  };

  const handleInputChange = (sus: string, text: string) => {
    setData((prev) => ({
      ...prev,
      [sus]: text,
    }));
  };

  useEffect(() => {
    setData((prev) => ({
      ...prev,
      latitude: location.current?.coords.latitude || 0,
      longitude: location.current?.coords.longitude || 0,
    }));
  }, [location?.current?.coords]);

  return (
    <SafeAreaView className="flex-1 bg-white justify-center items-center">
      <Stack.Screen options={{ headerShown: false }} />
      <Text className="font-semibold text-lg mb-5">Pothole Model</Text>
      <View className="w-full items-center">
        <Text>latitude:</Text>
        <View className="flex-row items-center w-2/3">
          <TextInput
            defaultValue="2.0000"
            inputMode="numeric"
            maxLength={10}
            textAlign="center"
            className="bg-gray-200 text-gray-500 w-full"
            value={data?.latitude?.toString()}
            onChangeText={(text) => handleInputChange("latitude", text)}
          ></TextInput>
          <TouchableOpacity
            className="w-5 h-5 ml-2 rounded-sm bg-blue-500 justify-center items-center"
            onPress={updateLocation}
          >
            <View className="w-2 h-2 rounded-sm bg-white"></View>
          </TouchableOpacity>
        </View>
        <Text>longitude:</Text>
        <View className="flex-row items-center  w-2/3">
          <TextInput
            defaultValue="2.0000"
            inputMode="numeric"
            maxLength={10}
            textAlign="center"
            className="bg-gray-200 text-gray-500 w-full"
            value={data?.longitude?.toString()}
            onChangeText={(text) => handleInputChange("longitude", text)}
          ></TextInput>
          <TouchableOpacity
            className="w-5 h-5 ml-2 rounded-sm bg-blue-500 justify-center items-center"
            onPress={updateLocation}
          >
            <View className="w-2 h-2 rounded-sm bg-white"></View>
          </TouchableOpacity>
        </View>
        <Text>speed:</Text>
        <TextInput
          defaultValue="0"
          inputMode="numeric"
          maxLength={5}
          textAlign="center"
          className="bg-gray-200 text-gray-500 w-2/3"
          value={data?.speed?.toString()}
          onChangeText={(text) => handleInputChange("speed", text)}
        ></TextInput>
        <Text>accX:</Text>
        <TextInput
          defaultValue="0"
          inputMode="numeric"
          maxLength={5}
          textAlign="center"
          value={data?.accX?.toString()}
          className="bg-gray-200 text-gray-500 w-2/3"
          onChangeText={(text) => handleInputChange("accX", text)}
        ></TextInput>
        <Text>accY:</Text>
        <TextInput
          defaultValue="0"
          inputMode="numeric"
          maxLength={5}
          textAlign="center"
          value={data?.accY?.toString()}
          className="bg-gray-200 text-gray-500 w-2/3"
          onChangeText={(text) => handleInputChange("accY", text)}
        ></TextInput>
        <Text>accZ:</Text>
        <TextInput
          defaultValue="0"
          inputMode="numeric"
          maxLength={5}
          textAlign="center"
          value={data?.accY?.toString()}
          className="bg-gray-200 text-gray-500 w-2/3"
          onChangeText={(text) => handleInputChange("accY", text)}
        ></TextInput>
        <Text>gyroX:</Text>
        <TextInput
          defaultValue="0"
          inputMode="numeric"
          maxLength={5}
          textAlign="center"
          value={data?.gyroX?.toString()}
          className="bg-gray-200 text-gray-500 w-2/3"
          onChangeText={(text) => handleInputChange("gyroX", text)}
        ></TextInput>
        <Text>gyroY:</Text>
        <TextInput
          defaultValue="0"
          inputMode="numeric"
          maxLength={5}
          textAlign="center"
          value={data?.gyroY?.toString()}
          className="bg-gray-200 text-gray-500 w-2/3"
          onChangeText={(text) => handleInputChange("gyroY", text)}
        ></TextInput>
        <Text>gyroZ:</Text>
        <TextInput
          defaultValue="0"
          inputMode="numeric"
          maxLength={5}
          textAlign="center"
          value={data?.gyroZ?.toString()}
          className="bg-gray-200 text-gray-500 w-2/3"
          onChangeText={(text) => handleInputChange("gyroZ", text)}
        ></TextInput>
      </View>
      <TouchableOpacity
        className="bg-blue-600 p-5 py-2 rounded-sm mt-5"
        onPress={sendrequest}
      >
        <Text className="font-semibold text-white">Predict</Text>
      </TouchableOpacity>
      {typeof output == "number" && <Text className="">{output}</Text>}
    </SafeAreaView>
  );
};

export default TestPothole;

const styles = StyleSheet.create({});
