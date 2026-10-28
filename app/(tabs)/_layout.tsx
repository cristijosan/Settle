import { Colors } from "@/constants/Colors";
import { NativeTabs } from "expo-router/unstable-native-tabs";

// SF Symbols on iOS and Material Symbols on Android, so each platform
// gets its own native, crisp tab icons with filled selected states.
export default function TabLayout() {
  return (
    <NativeTabs tintColor={Colors.primary} iconColor={Colors.black}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Jobs</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "briefcase", selected: "briefcase.fill" }}
          md="work"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tailored">
        <NativeTabs.Trigger.Label>Tailored</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "doc.text", selected: "doc.text.fill" }}
          md="description"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          md="settings"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
