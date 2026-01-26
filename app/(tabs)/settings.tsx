import { ScreenHeader } from "@/components/ScreenHeader";
import { SettingsButton } from "@/components/SettingsButton";
import { Colors } from "@/constants/Colors";
import { StyleSheet, View } from "react-native";

export default function Settings() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings"/>
      <View style={styles.scrollContent}>
        <SettingsButton 
          label="Instruction" 
          iconName="instruction"
          isPrimary={true} 
        />
        <SettingsButton 
          label="Privacy & Policy" 
          iconName="privacy" 
        />
        <SettingsButton 
          label="Terms of Use" 
          iconName="terms" 
        />

        <View style={styles.separator} />

        <SettingsButton 
          label="Support" 
          iconName="support"
        />
        <SettingsButton 
          label="Rate Us" 
          iconName="rate"
        />
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