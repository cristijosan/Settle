import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  View
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.firstContent}>
        <View style={styles.textBlock}>
          <Text style={[Typography.medium24, {fontSize: 32, lineHeight: 40}]}>Welcome to</Text>
          <Text style={[Typography.bold20, {fontSize: 32, lineHeight: 40, color: Colors.blue}]}>Pay ME</Text>
          <View style={{flex: 1}}>
            <ImageBackground source={require('@/assets/images/rain-coins.png')} style={styles.payoutContainer} imageStyle={styles.payoutImage}>
              <View style={styles.blueOverlay} />
              <Text style={{fontSize: 120, lineHeight: 120}}>💸</Text>
            </ImageBackground>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  firstContent: {
    paddingHorizontal: 20,
  },
  textBlock: {},
  payoutContainer: {
    overflow: 'hidden',
    backgroundColor: Colors.blue,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
    borderRadius: 24,
    height: 196,
  },
  payoutImage: {
    resizeMode: 'contain',
    left: -20,
    opacity: 0.5
  },
  blueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.blue,
    opacity: 0.6
  },
})