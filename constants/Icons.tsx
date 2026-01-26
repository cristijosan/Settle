import InstructionIcon from "@/assets/icons/help.svg";
import PrivacyIcon from "@/assets/icons/privacy.svg";
import RateIcon from "@/assets/icons/rate.svg";
import SupportIcon from "@/assets/icons/support.svg";
import TermsIcon from "@/assets/icons/terms.svg";

export const Icons = {
  instruction: InstructionIcon,
  privacy: PrivacyIcon,
  terms: TermsIcon,
  support: SupportIcon,
  rate: RateIcon,
};

export type IconName = keyof typeof Icons;