import { filterCoordinatesBasedOnAngle } from "./logic/filterCoordinatesBasedOnAngle";
import { getBoundingBoxArray } from "./logic/getBoundingBoxes";
import { queryPotholesInBoundingBoxArray } from "./workers/queryDatabase";
import { getRoute } from "./workers/getRoute";
import { decodePolyline } from "./logic/decodePolyline";
import { coordinateType } from "./types";

type Props = {
  origin: string;
  destination: string;
};

export const getTheULTIMATEroute = async ({ origin, destination }: Props) => {

  const routeObj = await getRoute(origin, destination);

  // console.log(routeObj);

  const masterCoordinatesArray: {
    polyline: string;
    coordinatesArray: coordinateType[];
  }[] = routeObj?.allRoutes.map(
    (eachRouteObj: { polyline: string; waypoints: any[] }) => {
      const sus = decodePolyline(eachRouteObj.polyline);
      return { polyline: eachRouteObj.polyline, coordinatesArray: sus };
    }
  );

  const allRoutesCalculation = await Promise.all(
    masterCoordinatesArray.map(async (coordinatesObj, index) => {
      const coordinatesArray = coordinatesObj.coordinatesArray;
      const polyline = coordinatesObj.polyline;
      console.log(`original array length : ${coordinatesArray.length}`);

      const filteredCoordinates =
        filterCoordinatesBasedOnAngle(coordinatesArray);
      console.log(`filtered arrayy length : ${filteredCoordinates.length}`);

      // console.log(makeDesmosString(coordinatesArray));
      // console.log("\n\n\n");
      // console.log(makeDesmosString(filteredCoordinates));

      const boundingBoxArray = getBoundingBoxArray(filteredCoordinates);
      console.log(`Bounding Box array length is `, boundingBoxArray.length);

      const queryResult = await queryPotholesInBoundingBoxArray(
        boundingBoxArray
      );
      console.log(
        ` no. of potholes in route no. ${index} : ${queryResult?.length} `
      );
      return {
        coordinatesArray,
        polyline,
        countPotholes: queryResult?.length || 0,
      };
    })
  );

  console.log("allRoutesCalculation : ", allRoutesCalculation);
  return allRoutesCalculation
};
