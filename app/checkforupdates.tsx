import { Alert, Button, StyleSheet, Text, View } from "react-native";
import React from "react";
import * as Updates from "expo-updates";

const Checkforupdates = () => {
  async function onFetchUpdateAsync() {
    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } else {
        Alert.alert(
          "no Updates",
          "no updates",
          [
            {
              text: "OK",
              // onPress: () => router.push("/"),
            },
          ]
        );
      }
    } catch (error) {
      // You can also add an alert() to see the error message in case of an error when fetching updates.
      alert(`Error fetching latest Expo update: ${error}`);
    }
  }

  return (
    <View className="flex-1 bg-blue-100 justify-center">
      <Button title="Fetch update" onPress={onFetchUpdateAsync} />
    </View>
  );
};

export default Checkforupdates;

const styles = StyleSheet.create({});
