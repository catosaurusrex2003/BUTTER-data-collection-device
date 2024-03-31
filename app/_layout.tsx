import { Stack } from "expo-router";
import { RootSiblingParent } from "react-native-root-siblings";
import { store } from "../store";
import { Provider } from "react-redux";

export default function HomeLayout() {
  return (
    <RootSiblingParent>
      <Provider store={store}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: "skyblue",
            },
            headerTintColor: "white",
            headerTitleStyle: {
              fontWeight: "bold",
            },
            // headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="gyroscope"
            options={{ title: "test the gyroscope here" }}
          />
          <Stack.Screen
            name="accelometer"
            options={{ title: "test the accelometer here" }}
          />
          {/* <Stack.Screen
        name="modal"
        options={{
          // Set the presentation mode to modal for our modal route.
          presentation: "modal",
        }}
      /> */}
        </Stack>
      </Provider>
    </RootSiblingParent>
  );
}
