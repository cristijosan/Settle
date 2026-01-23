import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs tintColor={"#2C4EE8"}>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon src={require("../../assets/icons/home.png")} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="claimed">
        <Icon src={require("../../assets/icons/claimed.png")} />
        <Label>Claimed</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon src={require("../../assets/icons/settings.png")} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
