import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-gesture-handler";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: true,
      retry: false,
    },
  },
});

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  const [loaded, error] = useFonts({
    "Archivo-Regular": require("../assets/fonts/Archivo-Regular.ttf"),
    "Archivo-Medium": require("../assets/fonts/Archivo-Medium.ttf"),
    "Archivo-Bold": require("../assets/fonts/Archivo-Bold.ttf"),
    "Archivo-SemiBold": require("../assets/fonts/Archivo-SemiBold.ttf"),
  });

  useEffect(() => {
    async function checkSubscription() {
      const value = await AsyncStorage.getItem('isPremium');
      setIsPremium(value === 'true');
    }
    checkSubscription();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem("hasSeenOnboarding").then((value) => {
      setIsFirstLaunch(value === null);
      setIsNavigationReady(true);
    });
  }, []);

  useEffect(() => {
    if ((loaded || error) && isFirstLaunch !== null) {
      setIsNavigationReady(true);
      SplashScreen.hideAsync();
    }
  }, [loaded, error, isFirstLaunch]);

  useEffect(() => {
    if (!isNavigationReady || isFirstLaunch === null) return;
    const isOnboarding = segments[0] === "onboarding";
    const isPaywall = segments[0] === "paywall"

    if (isFirstLaunch && !isOnboarding) {
    router.replace("/onboarding");
  } else if (!isPremium && !isPaywall && !isOnboarding) {
    router.replace("/paywall");
  }
  }, [isFirstLaunch, isNavigationReady, isPremium]);

  if (!isNavigationReady || isFirstLaunch === null) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          presentation: "card",
        }}
      >
        <Stack.Screen
          name="search"
          options={{
            animation: "slide_from_right",
            presentation: "card",
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="company/[id]"
          options={{
            animation: "slide_from_right",
            presentation: "card",
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="claim-modal"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.45],
            sheetGrabberVisible: true,
            headerShown: false,
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
