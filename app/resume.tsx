import { CvUploadPanel } from '@/components/CvUploadPanel'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Colors } from '@/constants/Colors'
import { Typography } from '@/constants/Typography'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

const PROMISES = [
	{ icon: 'lock-closed-outline', text: 'Stored only on this device' },
	{
		icon: 'shield-checkmark-outline',
		text: 'Employers, titles and dates are never changed',
	},
	{ icon: 'sparkles-outline', text: 'Rewritten for every job you pick' },
] as const

export default function ResumeScreen() {
	return (
		<View style={styles.container}>
			<ScreenHeader title='My CV' leftElement='back' />
			<ScrollView contentContainerStyle={styles.content}>
				<Text style={[Typography.medium24, { lineHeight: 30 }]}>
					The CV we{' '}
					<Text
						style={[Typography.bold20, { fontSize: 24, color: Colors.primary }]}
					>
						tailor
					</Text>{' '}
					for each job
				</Text>
				<View style={{ marginTop: 24 }}>
					<CvUploadPanel />
				</View>
				<View style={styles.promises}>
					{PROMISES.map(({ icon, text }) => (
						<View key={text} style={styles.promise}>
							<Ionicons name={icon} size={18} color={Colors.primary} />
							<Text
								style={[Typography.regular14, { color: Colors.black, flex: 1 }]}
							>
								{text}
							</Text>
						</View>
					))}
				</View>
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: Colors.white },
	content: { padding: 20 },
	promises: {
		marginTop: 30,
		gap: 16,
		paddingHorizontal: 14,
	},
	promise: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
})
