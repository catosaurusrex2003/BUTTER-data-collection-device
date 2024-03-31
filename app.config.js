import 'dotenv/config';

// since i cant include secrets in 

export default ({ config }) => {
    return {
        ...config, // existing configuration
        android: {
            ...config.android, // existing android configuration
            config: {
                googleMaps: {
                    apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY,
                },
            },
        },
    };
};
