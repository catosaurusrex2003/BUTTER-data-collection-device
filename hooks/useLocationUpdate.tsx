import * as Location from "expo-location";
import { useEffect, useState } from "react";

export type locationThing = {
  prev: Location.LocationObject | null;
  current: Location.LocationObject | null;
};

const useLocationUpdate = (
  timeInterval: number = 2000,
  distanceInterval: number = 0
) => {
  const [locationUpdateSubscription, setLocationUpdateSubscription] =
    useState<Location.LocationSubscription | null>();
  const [location, setLocation] = useState<locationThing>({
    prev: null,
    current: null,
  });
  const [permissionStatus, setPermisionStatus] = useState<boolean>(false);
  const [locationErrorMsg, setLocationErrorMsg] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationErrorMsg("Permission to access location was denied");
        return;
      } else {
        setPermisionStatus(true);
      }
    })();
  }, []);
  const updateLocation = async () => {
    let currLocation = await Location.getCurrentPositionAsync({});
    setLocation((previousState) => {
      const p = previousState.current;
      return { prev: p, current: currLocation };
    });
  };
  const subscribeLocationUpdate = async () => {
    const something = await Location.watchPositionAsync(
      { timeInterval: timeInterval, distanceInterval: distanceInterval },
      (currLocation) => {
        setLocation((previousState) => {
          const p = previousState.current;
          return { prev: p, current: currLocation };
        });
      }
    );
    setLocationUpdateSubscription(something);
    setIsRunning(true);
  };
  const unSubscribeLocationUpdate = () => {
    locationUpdateSubscription?.remove();
    setLocationUpdateSubscription(null);
    setIsRunning(false);
  };
  const toggleLocationSubscription = () => {
    if (locationUpdateSubscription) unSubscribeLocationUpdate();
    else subscribeLocationUpdate();
  };
  return {
    location,
    updateLocation,
    // subscribeLocationUpdate,
    // unSubscribeLocationUpdate,
    isRunning,
    locationUpdateSubscription,
    toggleLocationSubscription,
    locationErrorMsg,
    permissionStatus,
  };
};

export default useLocationUpdate;
