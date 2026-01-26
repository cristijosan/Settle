import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import {
  Dimensions,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const COMPANIES = [
  { id: "1", name: "Robinhood", price: 50 },
  { id: "2", name: "McDonalds", price: 25 },
  { id: "3", name: "Walmart", price: 25 },
  { id: "4", name: "Shell", price: 50 },
  { id: "5", name: "General Electric", price: 50 },
  { id: "6", name: "J&J", price: 75 },
  { id: "7", name: "Apple", price: 20 },
  { id: "8", name: "KTM", price: 50 },
  { id: "9", name: "PlayStation", price: 25 },
];

export default function Onboarding() {
  const firstStep = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.firstContent}>
        <Text style={[Typography.medium24, { fontSize: 32, lineHeight: 40 }]}>
          Welcome to
        </Text>
        <Text
          style={[
            Typography.bold20,
            { fontSize: 32, lineHeight: 40, color: Colors.blue },
          ]}
        >
          Pay Me
        </Text>
      </View>
      <View style={styles.firstBlock}>
        <ImageBackground
          source={require("@/assets/images/rain-coins.png")}
          style={styles.payoutContainer}
          imageStyle={styles.payoutImage}
        >
          <View style={styles.blueOverlay} />
          <Text style={[Typography.medium24, { color: Colors.white }]}>
            We will help you
          </Text>
        </ImageBackground>
        <Text style={styles.firstIcon}>💸</Text>
        <Text
          style={[
            Typography.medium24,
            {
              fontSize: 26,
              color: Colors.black,
              lineHeight: 36,
              paddingTop: 10,
              paddingHorizontal: 8,
            },
          ]}
        >
          Get Money you Deserve from Settlements
        </Text>
      </View>
      <View style={styles.buttonWrapper}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text
            style={[
              Typography.bold20,
              { color: Colors.white, textAlign: "center" },
            ]}
          >
            Continue
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  return <>{firstStep}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  firstContent: {
    paddingHorizontal: 20,
  },
  payoutContainer: {
    overflow: "hidden",
    backgroundColor: Colors.blue,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
    borderRadius: 24,
    height: 196,
    justifyContent: "flex-end",
  },
  payoutImage: {
    resizeMode: "contain",
    left: -20,
    opacity: 0.5,
  },
  blueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.blue,
    opacity: 0.6,
  },
  firstIcon: {
    fontSize: 120,
    lineHeight: 130,
    position: "absolute",
    right: 30,
    top: -50,
  },
  firstBlock: {
    paddingHorizontal: 20,
  },
  buttonWrapper: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20, // Учет Safe Area
    paddingTop: 10,
  },
  primaryButton: {
    backgroundColor: Colors.blue,
    height: 56,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});
