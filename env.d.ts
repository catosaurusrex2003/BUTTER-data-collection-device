// created this env.d.ts file to stop the type error while importing '@env'
// Cannot find module '@env' or its corresponding type declarations.ts(2307)
declare module "@env" {
  export const BASEURL: string;
  export const TESTENV: string;
  export const EXPO_PUBLIC_GOOGLE_MAPS_APIKEY: string;
  export const EXPO_PUBLIC_AWS_region: string;
  export const EXPO_PUBLIC_AWS_accessKeyId: string;
  export const EXPO_PUBLIC_AWS_secretAccessKey: string;
}
