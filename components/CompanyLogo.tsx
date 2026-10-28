import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { initials, logoUrl } from '@/utils/format';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface CompanyLogoProps {
  name: string;
  url?: string;
  size?: number;
}

export const CompanyLogo = ({ name, url, size = 42 }: CompanyLogoProps) => {
  const source = url ? logoUrl(url) : null;
  const [failed, setFailed] = useState(false);
  const shape = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={[styles.logo, shape]}>
      <Text style={[Typography.bold16, styles.text, { fontSize: size * 0.36, lineHeight: size * 0.44 }]}>
        {initials(name)}
      </Text>
      {source && !failed && (
        <Image
          source={source}
          style={[StyleSheet.absoluteFill, styles.image, shape]}
          contentFit="cover"
          cachePolicy="disk"
          recyclingKey={source}
          transition={150}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  logo: {
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    backgroundColor: Colors.white,
  },
  text: {
    color: Colors.primary,
  },
});
