import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import Toast from "react-native-root-toast";
import useLocationUpdate from "../../hooks/useLocationUpdate";

const Speed = () => {
  const {
    location,
    updateLocation,
    toggleLocationSubscription,
    locationUpdateSubscription,
    locationErrorMsg,
  } = useLocationUpdate(3000, 0);

  useEffect(() => {
    Toast.show("location gotted", {
      duration: 300,
      position: Toast.positions.TOP + 100,
    });
  }, [location]);

  return (
    <View className="flex-1 justify-center items-center">
      <View className="bg-gray-300 p-5 my-5 w-4/5 justify-center items-center rounded-md">
        <Text className="mb-5 text-lg font-bold">Previous</Text>
        <View className="flex-row  my-1 w-full justify-between">
          <Text className="font-semibold">Altitude: </Text>
          {location.prev && (
            <Text className="font-semibold ">
              {location.prev?.coords.altitude}
            </Text>
          )}
        </View>
        <View className="flex-row  my-1 w-full justify-between">
          <Text className="font-semibold">Latitude: </Text>
          {location.prev && (
            <Text className="font-semibold ">
              {location.prev?.coords.latitude}
            </Text>
          )}
        </View>
        <View className="flex-row  my-1 w-full justify-between">
          <Text className="font-semibold">Longitude: </Text>
          {location.prev && (
            <Text className="font-semibold ">
              {location.prev?.coords.longitude}
            </Text>
          )}
        </View>
        <View className="flex-row  my-1 w-full justify-between">
          <Text className="font-semibold">Speed: </Text>
          {location.prev && (
            <Text className="font-semibold ">
              {location.prev?.coords.speed}
            </Text>
          )}
        </View>
        <View className="flex-row  my-1 w-full justify-between">
          <Text className="font-semibold">altitude: </Text>
          {location.prev && (
            <Text className="font-semibold ">
              {location.prev?.coords.altitude}
            </Text>
          )}
        </View>
      </View>
      <View className="bg-gray-300 p-5 w-4/5 justify-center items-center rounded-md">
        <Text className="mb-5 text-lg font-bold">Current</Text>
        <View className="flex-row  my-1 w-full justify-between">
          <Text className="font-semibold">Altitude: </Text>
          {location.current && (
            <Text className="font-semibold ">
              {location.current?.coords.altitude}
            </Text>
          )}
        </View>
        <View className="flex-row  my-1 w-full justify-between">
          <Text className="font-semibold">Latitude: </Text>
          {location.current && (
            <Text className="font-semibold ">
              {location.current?.coords.latitude}
            </Text>
          )}
        </View>
        <View className="flex-row  my-1 w-full justify-between">
          <Text className="font-semibold">Longitude: </Text>
          {location.current && (
            <Text className="font-semibold ">
              {location.current?.coords.longitude}
            </Text>
          )}
        </View>
        <View className="flex-row  my-1 w-full justify-between">
          <Text className="font-semibold">Speed: </Text>
          {location.current && (
            <Text className="font-semibold ">
              {location.current?.coords.speed}
            </Text>
          )}
        </View>
        <View className="flex-row  my-1 w-full justify-between">
          <Text className="font-semibold">altitude: </Text>
          {location.current && (
            <Text className="font-semibold ">
              {location.current?.coords.altitude}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        className="bg-blue-600 p-5 py-2 rounded-sm mt-5"
        onPress={updateLocation}
      >
        <Text className="font-semibold text-white">Update</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-blue-600 p-5 py-2 rounded-sm mt-5"
        onPress={toggleLocationSubscription}
      >
        <Text className="font-semibold text-white">
          {locationUpdateSubscription ? "UnSubscribe" : "Subscribe"}
        </Text>
      </TouchableOpacity>
      <Text className=" text-red-600">{locationErrorMsg}</Text>
    </View>
  );
};

export default Speed;

const styles = StyleSheet.create({});
