import { Stack, Tabs } from "expo-router";
import { Text } from "react-native";

export default function Layout() {
  return (
    <>
      <Stack.Screen options={{ headerTitle: "Test Sensor Models" }} />
      <Tabs
        screenOptions={{
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen
          name="pothole"
          options={{
            title: "Pothole",
            tabBarStyle: {
              backgroundColor: "Red",
            },
            tabBarItemStyle: {
              backgroundColor: "Red",
            },
            tabBarIconStyle: {
              fontSize: 20,
            },
          }}
        />
        <Tabs.Screen
          name="quality"
          options={{
            title: "Quality",
          }}
        />
        <Tabs.Screen
          name="speed"
          options={{
            title: "Test speed",
          }}
        />
        <Tabs.Screen
          name="testcamera"
          options={{
            title: "Push image with coord in sqs",
            headerShown: false,
          }}
        />
      </Tabs>
    </>
  );
}
