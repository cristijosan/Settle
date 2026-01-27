import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useLawsuitDetails } from "@/hooks/useLawsuits";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function ClaimModal() {
  const router = useRouter();
  const { id, source } = useLocalSearchParams();
  const item = useLawsuitDetails(id as string);

  const handleConfirm = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (!item) return;

    const existingClaims = await AsyncStorage.getItem("user_claims");
    const claims = existingClaims ? JSON.parse(existingClaims) : [];

    const newClaim = item;

    if (!claims.find((c: any) => c.id === newClaim.id)) {
      const updatedClaims = [newClaim, ...claims];
      await AsyncStorage.setItem("user_claims", JSON.stringify(updatedClaims));
    }

    Alert.alert(
      "Claim filed successfully!",
      "Your claim has been submitted and is being processed.",
      [
        {
          text: "Continue",

          onPress: () => {
            router.dismissAll();
            router.push("/");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={[Typography.bold20, styles.subject]}>
          Lantern by Labatron
        </Text>
        <Image
          source={source ? source : require("@/assets/images/company.png")}
          style={styles.logo}
        />
        <Text style={[Typography.bold16, styles.description]}>
          Did you submit a claim?
        </Text>

        {/* 2 Buttons */}
        <View style={styles.buttonGroup}>
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={handleConfirm}
          >
            <Text style={[Typography.medium16, { color: Colors.white }]}>
              Yes
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
              router.back();
            }}
          >
            <Text style={[Typography.medium16, { color: Colors.black }]}>
              No
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 24,
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  subject: {
    color: Colors.black,
    marginTop: 8,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginTop: 40,
  },
  description: {
    color: Colors.blue,
    textAlign: "center",
    marginBottom: 40,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  buttonGroup: {
    width: "100%",
    gap: 12,
    paddingBottom: 50,
  },
  button: {
    width: "100%",
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: Colors.blue,
  },
  secondaryButton: {
    backgroundColor: Colors.grayLight,
  },
});
