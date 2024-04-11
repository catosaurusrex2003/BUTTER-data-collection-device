import React, { useEffect, useRef } from "react";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import {
  UserDestinationType,
  UserOriginType,
  wayPointPolylineType,
} from "../types/mapTypes";
import { getRandomColor } from "../utils/getRandomColor";
import { Text, View } from "react-native";

type Props = {
  userOrigin: UserOriginType | null;
  userDestination: UserDestinationType | null;
  wayPointPolylineState: wayPointPolylineType[];
  allPotholeData: any;
};

function CustomMap({
  userOrigin,
  userDestination,
  wayPointPolylineState,
  allPotholeData,
}: Props) {
  const EXPO_PUBLIC_GOOGLE_MAPS_APIKEY = process.env
    .EXPO_PUBLIC_GOOGLE_MAPS_APIKEY as string;
  let potholeData = undefined;
  if (allPotholeData) {
    potholeData = JSON.parse(allPotholeData);
    console.log(potholeData[0]);
  }

  const mapRef = useRef<MapView | null>(null);
  const homemarker = {
    latitude: 19.1109221,
    longitude: 72.8774946,
  };

  const findAverage = (arr: any) =>
    arr.reduce((acc: any, curr: any) => acc + curr, 0) / arr.length;

  useEffect(() => {
    mapRef.current?.fitToSuppliedMarkers(
      [
        "origin" || userOrigin?.description,
        "destination" || userDestination?.description,
      ],
      {
        edgePadding: { top: 200, right: 50, bottom: 0, left: 50 },
      }
    );
  }, [userOrigin, userDestination]);

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      mapType="terrain"
      initialRegion={{
        latitude: homemarker.latitude,
        longitude: homemarker.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }}
      provider={PROVIDER_GOOGLE}
      zoomEnabled={true}
      showsUserLocation={true}
      showsTraffic={true}
      zoomTapEnabled={true}
      minZoomLevel={0}
      maxZoomLevel={20}
    >
      {potholeData?.map((eachPothole: any) => (
        <Marker
          key={`pothole ${eachPothole._id.$oid}`}
          title={`pothole ${eachPothole._id.$oid}`}
          coordinate={{
            latitude: eachPothole.location.coordinates[1],
            longitude: eachPothole.location.coordinates[0],
          }}
          description={`lat:${eachPothole.location.coordinates[1]} lon:${
            eachPothole.location.coordinates[0]
          } avg: ${findAverage(eachPothole.numberofPotholes)}`}
          identifier={`pothole ${eachPothole._id.$oid}`}
        />
      ))}
      {userOrigin && userOrigin.location && (
        <Marker
          key={`${userOrigin.description || "origin"}`}
          title={`${userOrigin.description || "origin"}`}
          coordinate={{
            latitude: userOrigin.location?.lat,
            longitude: userOrigin.location?.lng,
          }}
          identifier={`origin`}
          pinColor="blue"
        />
      )}
      {userDestination?.location?.lat && (
        <Marker
          key={`destination`}
          title={`destination`}
          coordinate={{
            latitude: userDestination.location?.lat,
            longitude: userDestination.location?.lng,
          }}
          description={userDestination.description}
          identifier={`destination`}
          pinColor="blue"
        />
      )}
      {wayPointPolylineState?.map((element, index) => {
        console.log("meow");
        const rc = getRandomColor();

        const midpointIndex = Math.floor(element.coordinatesArray.length / 2);
        const midpoint = element.coordinatesArray[midpointIndex];

        if (index == wayPointPolylineState.length - 1) {
          return (
            <>
              <Polyline
                strokeColor={"rgba(0,0,0,1)"}
                coordinates={element.coordinatesArray}
                lineJoin="round"
                strokeWidth={6}
              />
              <Marker coordinate={midpoint}>
                <View
                  style={{
                    backgroundColor: "white",
                    padding: 5,
                    borderRadius: 5,
                  }}
                >
                  <Text>{element.countPotholes} potholes</Text>
                </View>
              </Marker>
            </>
          );
        }
        return (
          <>
            <Polyline
              strokeColor={rc}
              coordinates={element.coordinatesArray}
              lineJoin="round"
              strokeWidth={6}
            />
            <Marker coordinate={midpoint}>
              <View
                style={{
                  backgroundColor: "white",
                  padding: 5,
                  borderRadius: 5,
                }}
              >
                <Text>{element.countPotholes} potholes</Text>
              </View>
            </Marker>
          </>
        );
      })}
    </MapView>
  );
}

export default CustomMap;
