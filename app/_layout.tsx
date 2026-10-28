import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePremium } from "@/hooks/useSubscription";
import { useResume } from "@/hooks/useResume";
import { CvAnalysis } from "@/services/CvAnalysis";
import { SubscriptionService } from "@/services/SubscriptionService";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from "expo-router";
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
SubscriptionService.activate().catch((error) =>
  console.warn("Adapty could not be activated", error)
);

// Onboarding is switched off for now: the app opens straight on the job list.
// Set to true to bring it back; it ends on the paywall, which can be closed.
const SHOW_INTRO = false;

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(
    SHOW_INTRO ? null : false
  );

  const [loaded, error] = useFonts({
    "Archivo-Regular": require("../assets/fonts/Archivo-Regular.ttf"),
    "Archivo-Medium": require("../assets/fonts/Archivo-Medium.ttf"),
    "Archivo-Bold": require("../assets/fonts/Archivo-Bold.ttf"),
    "Archivo-SemiBold": require("../assets/fonts/Archivo-SemiBold.ttf"),
  });

  useEffect(() => {
    if (!SHOW_INTRO) return;
    AsyncStorage.getItem("hasSeenOnboarding").then((value) => {
      setIsFirstLaunch(value === null);
    });
  }, []);

  const isNavigationReady = (loaded || !!error) && isFirstLaunch !== null;

  useEffect(() => {
    if (isNavigationReady) {
      SplashScreen.hideAsync();
    }
  }, [isNavigationReady]);

  useEffect(() => {
    if (!SHOW_INTRO || !isNavigationReady) return;
    if (isFirstLaunch && segments[0] !== "onboarding") {
      router.replace("/onboarding");
    }
  // Runs once per launch state, not on every navigation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFirstLaunch, isNavigationReady]);

  if (!isNavigationReady) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <CvAnalysisRunner />
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
            name="matches"
            options={{
              animation: "slide_from_right",
              presentation: "card",
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="job/[id]"
            options={{
              animation: "slide_from_right",
              presentation: "card",
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="resume"
            options={{
              animation: "slide_from_right",
              presentation: "card",
              gestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="paywall"
            options={{
              presentation: "fullScreenModal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="applied"
            options={{
              presentation: "fullScreenModal",
              animation: "fade_from_bottom",
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="tailor"
            options={{
              presentation: "formSheet",
              sheetAllowedDetents: [0.85],
              sheetGrabberVisible: true,
              sheetCornerRadius: 32,
              headerShown: false,
            }}
          />
        </Stack>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

/**
 * Sends the uploaded CV for AI analysis once the user is a subscriber — after a
 * purchase, on launch, or after a new upload. Never for free users, and never
 * twice for the same upload, so no credits are spent for nothing.
 */
function CvAnalysisRunner() {
  const queryClient = useQueryClient();
  const { data: isPremium } = usePremium();
  const { data: resume } = useResume();
  const resumeAddedAt = resume?.addedAt;

  useEffect(() => {
    if (!isPremium || !resumeAddedAt) return;
    CvAnalysis.run()
      .then((analysis) => queryClient.setQueryData(["cvAnalysis"], analysis))
      .catch((error) => console.warn("CV analysis did not run", error));
  }, [isPremium, resumeAddedAt, queryClient]);

  return null;
}
