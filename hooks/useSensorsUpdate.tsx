import {
  Accelerometer,
  AccelerometerMeasurement,
  Gyroscope,
  GyroscopeMeasurement,
} from "expo-sensors";
import { useEffect, useState } from "react";

export type dataType = {
  gyroX?: number;
  gyroY?: number;
  gyroZ?: number;
  accX?: number;
  accY?: number;
  accZ?: number;
};

type intervalType = {
  slow: number;
  fast: number;
};

type Props = {
  intervalObj?: intervalType;
  keeptrack?: boolean;
};

const useSensorsUpdate = ({
  intervalObj = { slow: 2000, fast: 1000 },
  keeptrack = true,
}: Props = {}) => {
  const [dataArray, setDataArray] = useState<dataType[]>(
    keeptrack
      ? [
          {
            gyroX: 0,
            gyroY: 0,
            gyroZ: 0,
            accX: 0,
            accY: 0,
            accZ: 0,
          },
          {
            gyroX: 0,
            gyroY: 0,
            gyroZ: 0,
            accX: 0,
            accY: 0,
            accZ: 0,
          },
          {
            gyroX: 0,
            gyroY: 0,
            gyroZ: 0,
            accX: 0,
            accY: 0,
            accZ: 0,
          },
          {
            gyroX: 0,
            gyroY: 0,
            gyroZ: 0,
            accX: 0,
            accY: 0,
            accZ: 0,
          },
          {
            gyroX: 0,
            gyroY: 0,
            gyroZ: 0,
            accX: 0,
            accY: 0,
            accZ: 0,
          },
          // 5 completed here
        ]
      : [
          {
            gyroX: 0,
            gyroY: 0,
            gyroZ: 0,
            accX: 0,
            accY: 0,
            accZ: 0,
          },
        ]
  );
  const [tempDataState, setTempDataState] = useState<dataType>({});
  const [gyroSubscription, setGyroSubscription] = useState<any>(null);
  const [accSubscription, setAccSubscription] = useState<any>(null);
  const [isFast, setIsFast] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const _slow = () => {
    setIsFast(false);
    Gyroscope.setUpdateInterval(intervalObj.slow);
    Accelerometer.setUpdateInterval(intervalObj.slow);
  };

  const _fast = () => {
    setIsFast(true);
    Gyroscope.setUpdateInterval(intervalObj.fast);
    Accelerometer.setUpdateInterval(intervalObj.fast);
  };

  const setGyroMesaurement = (gyroscopeData: GyroscopeMeasurement) => {
    const roundedOffData = {
      gyroX: parseFloat(gyroscopeData.x.toFixed(3)),
      gyroY: parseFloat(gyroscopeData.y.toFixed(3)),
      gyroZ: parseFloat(gyroscopeData.z.toFixed(3)),
    };
    setTempDataState((prev) => {
      if (
        tempDataState.hasOwnProperty("gyroX") &&
        tempDataState.hasOwnProperty("gyroY") &&
        tempDataState.hasOwnProperty("gyroZ")
      ) {
        return roundedOffData;
      } else {
        return { ...roundedOffData, ...prev };
      }
    });
  };

  const setAccMesaurement = (accelerometerData: AccelerometerMeasurement) => {
    const roundedOffData = {
      accX: parseFloat(accelerometerData.x.toFixed(3)),
      accY: parseFloat(accelerometerData.y.toFixed(3)),
      accZ: parseFloat(accelerometerData.z.toFixed(3)),
    };
    setTempDataState((prev) => {
      if (
        tempDataState.hasOwnProperty("accX") &&
        tempDataState.hasOwnProperty("accY") &&
        tempDataState.hasOwnProperty("accZ")
      ) {
        return roundedOffData;
      } else {
        return { ...roundedOffData, ...prev };
      }
    });
  };

  useEffect(() => {
    if (
      tempDataState.hasOwnProperty("accX") &&
      tempDataState.hasOwnProperty("accY") &&
      tempDataState.hasOwnProperty("accZ") &&
      tempDataState.hasOwnProperty("gyroX") &&
      tempDataState.hasOwnProperty("gyroY") &&
      tempDataState.hasOwnProperty("gyroZ")
    ) {
      setDataArray((prev) => {
        prev.shift();
        return [...prev, tempDataState];
      });
      setTempDataState({});
    }
  }, [tempDataState]);

  const _subscribe = () => {
    _fast();
    setIsRunning(true);
    setGyroSubscription(
      Gyroscope.addListener((gyroscopeData) => {
        setGyroMesaurement(gyroscopeData);
      })
    );
    setAccSubscription(
      Accelerometer.addListener((accelerometerData) => {
        setAccMesaurement(accelerometerData);
      })
    );
  };

  const _unsubscribe = () => {
    setIsRunning(false);
    gyroSubscription && gyroSubscription.remove();
    setGyroSubscription(null);
    accSubscription && accSubscription.remove();
    setAccSubscription(null);
  };

  const toggleSensorsSubscription = () => {
    // anything works
    gyroSubscription ? _unsubscribe() : _subscribe();
  };

  return {
    dataArray,
    // _subscribe,
    // _unsubscribe,
    toggleSensorsSubscription,
    _slow,
    _fast,
    isFast,
    isRunning,
  };
};

export default useSensorsUpdate;
