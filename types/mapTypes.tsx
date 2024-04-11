export type coordinateType = { latitude: number; longitude: number };
export type wayPointPolylineType = {
  coordinatesArray: coordinateType[];
  polyline: string;
  countPotholes: any;
};

export type UserOriginType = {
  location:
    | {
        lat: number;
        lng: number;
      }
    | undefined;
  description: string | undefined;
};
export type UserDestinationType = {
  location:
    | {
        lat: number;
        lng: number;
      }
    | undefined;
  description: string;
};
