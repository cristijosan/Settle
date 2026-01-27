import CheckIcon from "@/assets/icons/check.svg";
import CompanyIcon from "@/assets/icons/company.svg";
import OverviewIcon from "@/assets/icons/overview.svg";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { useLawsuitDetails } from "@/hooks/useLawsuits";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams();
  const item = useLawsuitDetails(id as string);
  const router = useRouter();

  if (!item) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ScreenHeader title="Details" leftElement="back" />
        <Text style={{ textAlign: "center" }}>
          Loading settlement details...
        </Text>
      </View>
    );
  }

  const handleClaim = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (item?.claim_url) {
      try {
        await WebBrowser.openBrowserAsync(item.claim_url, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
          toolbarColor: Colors.white,
          controlsColor: Colors.blue,
        });

        router.push({
          pathname: "/claim-modal",
          params: {
            id: item.id,
            name: item.company_name,
            source: item.company_logo_url,
          },
        });
      } catch (error) {
        console.error("Не удалось открыть ссылку:", error);
      }
    }
  };

  const RequirementsElement = (text: string, index: number) => (
    <View style={styles.requirementsText} key={index}>
      <View style={styles.requiredIcon}>
        <CheckIcon width={14} height={14} color={Colors.white} />
      </View>
      <Text style={[{ color: Colors.black }, Typography.regular14]}>
        {text}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Details" leftElement="back" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[Typography.medium24, { color: Colors.blue }]}>
          {item.name}
        </Text>
        <View style={styles.infoCard}>
          <View style={styles.infoCompany}>
            <Image
              source={
                item.company_logo_url
                  ? { uri: item.company_logo_url }
                  : require("@/assets/images/company.png")
              }
              style={styles.logo}
              resizeMode="contain"
            />
            <View
              style={[styles.badge, { backgroundColor: Colors.greenSecondary }]}
            >
              <Text style={[{ color: Colors.green }, Typography.regular14]}>
                not claimed
              </Text>
            </View>
          </View>
          <Text style={[{ color: Colors.black }, Typography.bold20]}>
            {item.company_name}
          </Text>
          <View style={styles.separator} />
          <View style={{ gap: 4 }}>
            <Text style={[{ color: Colors.gray }, Typography.regular12]}>
              Up To:
            </Text>
            <Text style={[{ color: Colors.black }, Typography.bold20]}>
              {item.payout_amount
                ? item.payout_amount
                : `${item.amounts.max.symbol}${item.amounts.max.amount}`}
            </Text>
          </View>
          <View style={styles.separator} />
          <View style={{ gap: 4 }}>
            <Text style={[{ color: Colors.gray }, Typography.regular12]}>
              Due date:
            </Text>
            <Text style={[{ color: Colors.black }, Typography.bold20]}>
              {item.deadline
                ? new Date(item.deadline * 1000).toLocaleDateString("en-US", {
                    month: "long",
                    day: "2-digit",
                    year: "numeric",
                  })
                : "TDB"}
            </Text>
          </View>
        </View>
        <View style={styles.requirements}>
          <Text style={[{ color: Colors.blue }, Typography.bold16]}>
            Requirements
          </Text>
          {item.eligibility_requirements &&
            item.eligibility_requirements.length > 0 &&
            item.eligibility_requirements.map((info, index) =>
              RequirementsElement(info, index)
            )}
        </View>
        <View style={styles.description}>
          <Text style={[{ color: Colors.black }, Typography.bold16]}>
            Description
          </Text>
          <View style={styles.descriptionText}>
            <OverviewIcon width={20} height={20} color={Colors.black} />
            <Text style={[{ color: Colors.black }, Typography.regular14]}>
              {item.description}
            </Text>
          </View>
        </View>
        <View style={styles.description}>
          <Text style={[{ color: Colors.black }, Typography.bold16]}>
            Lawfirm
          </Text>
          <View style={styles.descriptionText}>
            <CompanyIcon width={20} height={20} color={Colors.black} />
            <Text style={[{ color: Colors.black }, Typography.regular14]}>
              {item.representing_lawfirm_details}
            </Text>
          </View>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>
      <View style={styles.footerContainer}>
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0)",
            "rgba(255, 255, 255, 0.75)",
            "rgba(255, 255, 255, 0.90)",
          ]}
          style={styles.gradient}
          pointerEvents="none"
        />

        <View style={styles.buttonWrapper}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={handleClaim}
          >
            <Text
              style={[
                Typography.medium16,
                { color: Colors.white, textAlign: "center" },
              ]}
            >
              Claim
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 20 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    resizeMode: "contain",
    verticalAlign: "top",
  },
  infoCard: {
    marginTop: 25,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 20,
    gap: 5,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  infoCompany: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  separator: {
    marginVertical: 9,
    height: 1,
    backgroundColor: Colors.secondary,
  },
  badge: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 24,
  },
  requirements: {
    marginTop: 20,
    paddingHorizontal: 14,
    gap: 16,
  },
  requiredIcon: {
    width: 20,
    height: 20,
    backgroundColor: Colors.blue,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  requirementsText: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 20,
  },
  description: {
    marginTop: 30,
    paddingHorizontal: 14,
    gap: 16,
  },
  descriptionText: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 20,
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "flex-end",
  },
  gradient: {
    height: 200,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  buttonWrapper: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20, // Учет Safe Area
    paddingTop: 10,
  },
  primaryButton: {
    backgroundColor: Colors.blue,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});
