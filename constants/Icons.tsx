import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export const Icons = {
  cv: "document-text-outline",
  instruction: "compass-outline",
  privacy: "shield-checkmark-outline",
  terms: "reader-outline",
  support: "chatbubble-ellipses-outline",
  rate: "star-outline",
} satisfies Record<string, IoniconName>;

export type IconName = keyof typeof Icons;
