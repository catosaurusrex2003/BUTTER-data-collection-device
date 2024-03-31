import { Link, Stack, useFocusEffect, useRouter } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TouchableOpacity } from "react-native-gesture-handler";
import { collection, getDocs } from "firebase/firestore";
import { useEffect } from "react";
import { db } from "../firebaseconfig";
import { selectUrl, setUrl } from "../slices/databaseUrlSlice";
import { useDispatch, useSelector } from "react-redux";

const Index = () => {
  const dispatch = useDispatch();
  const databaseUrl = useSelector(selectUrl);

  useEffect(() => {
    const getServerUrl = async () => {
      const querySnapshot = await getDocs(collection(db, "aws-ec2-url"));
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`${doc.id} => ${data}`);
        console.log(data.dns);
        dispatch(setUrl(data.dns));
        // dispatch(setUrl("http://192.168.0.104:5000"));
      });
    };
    getServerUrl();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white justify-center items-center">
      <Stack.Screen options={{ headerShown: false }} />
      <Text className="text-sm text-gray-500 mb-1">v 5.1</Text>
      <View className=" flex-flex-col items-center p-5 w-2/3 bg-gray-100 rounded-md">
        <Text className=" w-full text-center font-bold text-lg mb-1 border-b border-black ">
          STREAMING
        </Text>
        <TouchableOpacity>
          <Link
            className="font-semibold text-base text-center  text-gray-800 my-2"
            href={"/potholestream"}
          >
            pothole sensor
          </Link>
        </TouchableOpacity>
        <TouchableOpacity>
          <Link
            className="font-semibold text-base text-center  text-gray-800 my-2"
            href={"/qualitystream"}
          >
            quality sensor
          </Link>
        </TouchableOpacity>
        <TouchableOpacity>
          <Link
            className="font-semibold text-base text-center  text-gray-800 my-2"
            href={"/streamcamera"}
          >
            image model
          </Link>
        </TouchableOpacity>
        <TouchableOpacity>
          <Link
            className="font-semibold text-base text-center  text-gray-800 my-2"
            href={"/allinone"}
          >
            All In One
          </Link>
        </TouchableOpacity>
        <TouchableOpacity>
          <Link
            className="font-semibold text-base text-center  text-gray-800 my-2"
            href={"/allinonevideo"}
          >
            All In One Video method
          </Link>
        </TouchableOpacity>
        <TouchableOpacity>
          <Link
            className="font-semibold text-base text-center  text-gray-800 my-2"
            href={"/sensorarray"}
          >
            Interval Sensor Array
          </Link>
        </TouchableOpacity>
      </View>
      <View className="flex-flex-col items-center p-5 w-2/3 bg-gray-100 rounded-md mt-4">
        <Text className=" w-full text-center font-bold text-lg mb-1 border-b border-black">
          FOR TESTING
        </Text>
        <TouchableOpacity>
          <Link
            className="font-semibold text-base text-center  text-gray-800 my-2"
            href={"/(test)/pothole"}
          >
            test sensors model
          </Link>
        </TouchableOpacity>
        <TouchableOpacity>
          <Link
            className="font-semibold text-base text-center  text-gray-800 my-2"
            href={"/(test)/testcamera"}
          >
            push image in sqs
          </Link>
        </TouchableOpacity>
        <TouchableOpacity>
          <Link
            className="font-semibold text-base text-center  text-gray-800 my-2"
            href={"/(test)/speed"}
          >
            check current speed
          </Link>
        </TouchableOpacity>
      </View>
      <Link
        className="font-semibold text-sm text-center text-gray-800 my-2"
        href={"/variables"}
      >
        variables
      </Link>
      <TouchableOpacity className=" mt-2">
        <Link
          className="font-medium text-base text-center bg-blue-500 text-white p-2 px-3 rounded-md"
          href={"/map"}
        >
          Map
        </Link>
      </TouchableOpacity>
      <TouchableOpacity className="mt-10 p-2 bg-blue-300 rounded-md">
        <Link href="checkforupdates">
          <Text className="  font-semibold">Check For Updates</Text>
        </Link>
      </TouchableOpacity>
    </SafeAreaView>
  );
};
export default Index;
