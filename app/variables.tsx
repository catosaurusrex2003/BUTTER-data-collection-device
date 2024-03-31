import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Index = () => {
  const EXPO_PUBLIC_GOOGLE_MAPS_APIKEY = process.env
    .EXPO_PUBLIC_GOOGLE_MAPS_APIKEY as string;

  const EXPO_PUBLIC_AWS_region = process.env.EXPO_PUBLIC_AWS_region as string;
  const EXPO_PUBLIC_AWS_accessKeyId = process.env
    .EXPO_PUBLIC_AWS_accessKeyId as string;
  const EXPO_PUBLIC_AWS_secretAccessKey = process.env
    .EXPO_PUBLIC_AWS_secretAccessKey as string;
  const bucketName = process.env.EXPO_PUBLIC_AWS_bucketName;
  const bucketRegion = process.env.EXPO_PUBLIC_AWS_bucketRegion;

  const EXPO_PUBLIC_apiKey = process.env.EXPO_PUBLIC_apiKey;
  const EXPO_PUBLIC_authDomain = process.env.EXPO_PUBLIC_authDomain;
  const EXPO_PUBLIC_projectId = process.env.EXPO_PUBLIC_projectId;
  const EXPO_PUBLIC_storageBucket = process.env.EXPO_PUBLIC_storageBucket;
  const EXPO_PUBLIC_messagingSenderId =
    process.env.EXPO_PUBLIC_messagingSenderId;
  const EXPO_PUBLIC_appId = process.env.EXPO_PUBLIC_appId;
  const EXPO_PUBLIC_measurementId = process.env.EXPO_PUBLIC_measurementI;

  return (
    <SafeAreaView className="flex-1 bg-white justify-center items-center">
      <Text>
        EXPO_PUBLIC_GOOGLE_MAPS_APIKEY :{EXPO_PUBLIC_GOOGLE_MAPS_APIKEY}
      </Text>
      <Text>EXPO_PUBLIC_AWS_region:{EXPO_PUBLIC_AWS_region}</Text>
      <Text>EXPO_PUBLIC_AWS_accessKeyId:{EXPO_PUBLIC_AWS_accessKeyId}</Text>
      <Text>
        EXPO_PUBLIC_AWS_secretAccessKey:{EXPO_PUBLIC_AWS_secretAccessKey}
      </Text>
      <Text>{bucketName}</Text>
      <Text>{bucketRegion}</Text>
      <Text>{EXPO_PUBLIC_apiKey}</Text>
      <Text>{EXPO_PUBLIC_authDomain}</Text>
      <Text>{EXPO_PUBLIC_projectId}</Text>
      <Text>{EXPO_PUBLIC_storageBucket}</Text>
      <Text>{EXPO_PUBLIC_messagingSenderId}</Text>
      <Text>{EXPO_PUBLIC_appId}</Text>
      <Text>{EXPO_PUBLIC_measurementId}</Text>
    </SafeAreaView>
  );
};
export default Index;
