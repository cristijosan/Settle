import { ScreenHeader } from "@/components/ScreenHeader";
import { SettingsButton } from "@/components/SettingsButton";
import { Colors } from "@/constants/Colors";
import { useResume } from "@/hooks/useResume";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function Settings() {
  const router = useRouter();
  const { data: resume } = useResume();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" />
      <View style={styles.scrollContent}>
        <SettingsButton
          label={resume ? "My CV" : "Upload your CV"}
          iconName="cv"
          isPrimary={true}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
            router.push("/resume");
          }}
        />
        <SettingsButton label="Instruction" iconName="instruction" />
        <SettingsButton label="Privacy & Policy" iconName="privacy" />
        <SettingsButton label="Terms of Use" iconName="terms" />

        <View style={styles.separator} />

        <SettingsButton label="Support" iconName="support" />
        <SettingsButton label="Rate Us" iconName="rate" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.secondary,
    marginVertical: 10,
    marginBottom: 18,
    marginHorizontal: 10,
  },
});
