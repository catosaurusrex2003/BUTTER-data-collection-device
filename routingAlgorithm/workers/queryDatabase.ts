import { boundingBox } from "../types";

export const queryPotholesInBoundingBoxArray = async (
  boundingBoxArray: boundingBox[]
) => {
  const query = {
    $or: boundingBoxArray.map((box) => ({
      location: {
        $geoWithin: {
          $box: [
            [
              Math.min(box.longitudeMin, box.longitudeMax),
              Math.min(box.latitudeMin, box.latitudeMax),
            ],
            [
              Math.max(box.longitudeMin, box.longitudeMax),
              Math.max(box.latitudeMin, box.latitudeMax),
            ],
          ],
        },
      },
    })),
  };

  try {
    const response = await fetch(
      "https://si9fed20e8.execute-api.ap-south-1.amazonaws.com/default/potholecount",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
        }),
      }
    );
    const result = await response.json();
    // const result = await Location.find(query);
    return result;
  } catch (error) {
    console.log(`ERROR while querying database: ${error}`);
  }
};
