import React, { useEffect, useState } from "react";
import CustomMap from "../components/CustomMap";
import { useSelector, useDispatch } from "react-redux";
import { selectUrl } from "../slices/databaseUrlSlice";
import { TouchableOpacity } from "react-native-gesture-handler";
import {
  GooglePlaceData,
  GooglePlaceDetail,
  GooglePlacesAutocomplete,
} from "react-native-google-places-autocomplete";
import { Image, ScrollView, Text, View } from "react-native";
import * as Location from "expo-location";
import { Stack } from "expo-router";
import { coordinateType, wayPointPolylineType } from "../types/mapTypes";
import { decodePolyline } from "../utils/decodePolyline";
import {
  coffeeIcon,
  gasIcon,
  libraryIcon,
  micIcon,
  myLocationBlueIcon,
  myLocationIcon,
  petIcon,
  ramenIcon,
  searchIcon,
} from "../constants/icons";
import {
  selectUserDestination,
  selectUserOrigin,
  setUserDestination,
  setUserOrigin,
} from "../slices/userSlice";
import { AppDispatch } from "../store";
import { getTheULTIMATEroute } from "../routingAlgorithm/main";

const mapNavOptions = [
  { src: ramenIcon, text: "Restaurant" },
  { src: petIcon, text: "Pet Shop" },
  { src: coffeeIcon, text: "Coffee" },
  { src: gasIcon, text: "Gas Station" },
  { src: libraryIcon, text: "Library" },
];

function PotholeMap() {
  const dispatch = useDispatch<AppDispatch>();
  // const databaseUrl = useSelector(selectUrl);
  const userOrigin = useSelector(selectUserOrigin);
  const userDestination = useSelector(selectUserDestination);

  const EXPO_PUBLIC_GOOGLE_MAPS_APIKEY = process.env
    .EXPO_PUBLIC_GOOGLE_MAPS_APIKEY as string;

  console.log("GOOGLE MAPS API KEY IS : ", EXPO_PUBLIC_GOOGLE_MAPS_APIKEY);

  const [allPotholeData, setAllPotholeData] = useState();
  const [wayPointPolylineState, setWayPointPolylineState] = useState<
    wayPointPolylineType[]
  >([]);
  const [tempUserOriginDest, setTempUserOriginDest] = useState<string>();

  const [status, requestPermission] = Location.useForegroundPermissions();

  const getData = async () => {
    try {
      const result = await fetch(
        `https://jf91cn6il1.execute-api.ap-south-1.amazonaws.com`
      );
      const data = await result.json();
      console.log("pothole data came");
      setAllPotholeData(data?.data);
    } catch (err) {
      console.log("ERROR WHILE FETCHING POTHOLE COORDINATES", err);
    }
  };

  async function getRoute(origin: string, destination: string) {
    // origin and destination can either be "Andheri station, Mumbai" or "12.2116445,12,2116445"
    const apiKey = EXPO_PUBLIC_GOOGLE_MAPS_APIKEY;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&alternatives=true&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        console.error("No routes found");
        if (data?.error_message) {
          console.error(data.error_message);
        }
        console.log(data);
        return;
      }

      // Extracting the main route
      const mainRoute = data.routes[0];
      const polyline = mainRoute.overview_polyline.points;
      const waypoints = mainRoute.waypoint_order;

      // Extracting alternate routes
      const alternateRoutes = data.routes.slice(1).map((route: any) => {
        return {
          polyline: route.overview_polyline.points,
          waypoints: route.waypoint_order,
        };
      });

      return {
        polyline,
        waypoints,
        alternateRoutes,
      };
    } catch (error) {
      console.error("Failed to fetch route data:", error);
    }
  }

  const handleRouteDirections = async (origin: string, destination: string) => {
    console.log(origin, "  ", destination);
    const ultimateRouteData = await getTheULTIMATEroute({
      origin,
      destination,
    });
    setWayPointPolylineState(ultimateRouteData);
  };

  useEffect(() => {
    getData();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const sperm = await requestPermission();
      if (!sperm.granted) return;
      const currentLocation = await Location.getCurrentPositionAsync();
      dispatch(
        setUserOrigin({
          location: {
            lat: currentLocation.coords.latitude,
            lng: currentLocation.coords.longitude,
          },
          description: "current location",
        })
      );
      setTempUserOriginDest("current location");
    } catch (error) {
      console.log("ERROR WHILE FETCHING LOCATION", error);
    }
  };

  useEffect(() => {
    if (userOrigin && userDestination?.location) {
      console.log("userOrigin is : ", userOrigin);
      console.log("user destination is :", userDestination);
      console.log(
        `origin is ${userOrigin?.location?.lat},${userOrigin?.location?.lng}`
      );
      console.log(
        `destination is ${userDestination?.location?.lat},${userDestination?.location?.lng}`
      );
      handleRouteDirections(
        `${userOrigin?.location?.lat},${userOrigin?.location?.lng}`,
        `${userDestination?.location?.lat},${userDestination?.location?.lng}`
      );
    }
  }, [userOrigin, userDestination?.location]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 relative">
        {/* top absolute part */}
        <View className="absolute  w-full flex items-center justify-center py-3 px-4 z-10 top-12">
          <View className="w-full flex flex-row justify-between items-center bg-white px-2 pt-1 mb-1 rounded-lg border-gray-200 border-[1px]">
            <Image source={myLocationIcon} style={{ width: 25, height: 25 }} />
            {/* <TextInput className="flex-1 mx-2" placeholder="Search Location" /> */}
            <GooglePlacesAutocomplete
              styles={{
                container: {
                  margin: 0,
                  padding: 0,
                },
                textInput: { fontSize: 15, marginTop: 2 },
              }}
              placeholder="Enter Source"
              query={{
                key: EXPO_PUBLIC_GOOGLE_MAPS_APIKEY,
                language: "en",
              }}
              fetchDetails={true}
              // @ts-ignore
              returnKeyType={"search"}
              onPress={(
                data: GooglePlaceData,
                details: GooglePlaceDetail | null = null
              ) => {
                dispatch(
                  setUserOrigin({
                    location: details?.geometry.location,
                    description: data.description,
                  })
                );
              }}
              enablePoweredByContainer={false}
              minLength={2}
              debounce={400}
            />
            <Image source={micIcon} style={{ width: 25, height: 25 }} />
          </View>
          <View className="w-full flex flex-row justify-between items-center bg-white px-2 pt-1 rounded-lg border-gray-200 border-[1px]">
            <Image source={searchIcon} style={{ width: 25, height: 25 }} />
            {/* <TextInput className="flex-1 mx-2" placeholder="Search Location" /> */}
            <GooglePlacesAutocomplete
              styles={{
                container: {
                  margin: 0,
                  padding: 0,
                },
                textInput: { fontSize: 15, marginTop: 2 },
              }}
              placeholder="Search Location"
              query={{
                key: EXPO_PUBLIC_GOOGLE_MAPS_APIKEY,
                language: "en",
              }}
              fetchDetails={true}
              // @ts-ignore
              returnKeyType={"search"}
              onPress={(
                data: GooglePlaceData,
                details: GooglePlaceDetail | null = null
              ) => {
                dispatch(
                  setUserDestination({
                    location: details?.geometry.location,
                    description: data.description,
                  })
                );
              }}
              enablePoweredByContainer={false}
              minLength={2}
              debounce={400}
            />
            <Image source={micIcon} style={{ width: 25, height: 25 }} />
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            horizontal
            className="w-full flex flex-row mt-1"
          >
            {mapNavOptions.map((eachNavOption, index) => (
              <View
                key={index}
                className=" flex flex-row items-center bg-white px-2 py-3 mr-1 rounded-lg border-gray-200 border-[1px]"
              >
                <Image
                  source={eachNavOption.src}
                  style={{ width: 17, height: 17 }}
                />
                <Text className="ml-1 ">{eachNavOption.text}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
        <CustomMap
          userOrigin={userOrigin}
          userDestination={userDestination}
          wayPointPolylineState={wayPointPolylineState}
          allPotholeData={allPotholeData}
        />
        {/* my Location part */}
        <View className="absolute bottom-10 w-full flex items-end ">
          <TouchableOpacity
            className="bg-white p-2 rounded-lg border-gray-200 border-[1px] mr-3"
            onPress={getCurrentLocation}
          >
            {userOrigin ? (
              <Image
                source={myLocationBlueIcon}
                style={{ width: 40, height: 40 }}
              />
            ) : (
              <Image
                source={myLocationIcon}
                style={{ width: 40, height: 40 }}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* the bottom part */}
        {/* <View className="absolute bottom-0 w-full flex justify-center items-center">
          <View className="items-center mb-4">
            <TouchableOpacity
              className="bg-blue-400 rounded-md px-3 py-2"
              // onPress={getData}
              onPress={getData}
            >
              <Text className="w-fit text-white font-semibold">
                Get Pothole Data
              </Text>
            </TouchableOpacity>
          </View>
        </View> */}
      </View>
    </>
  );
}

export default PotholeMap;
