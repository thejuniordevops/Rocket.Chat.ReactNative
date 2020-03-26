import { StyleSheet } from 'react-native';

import { verticalScale, moderateScale } from '../../utils/scaling';
import { isTablet } from '../../utils/deviceInfo';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: isTablet ? 'center' : 'flex-start'
	},
	onboarding: {
		alignSelf: 'center',
		marginTop: !isTablet && verticalScale(116),
		marginBottom: verticalScale(50),
		maxHeight: verticalScale(150),
		resizeMode: 'contain',
		width: 80,
		height: 70
	},
	title: {
		...sharedStyles.textBold,
		letterSpacing: 0,
		fontSize: moderateScale(24),
		alignSelf: 'center',
		marginBottom: verticalScale(8)
	},
	subtitle: {
		...sharedStyles.textRegular,
		fontSize: moderateScale(16),
		alignSelf: 'center',
		marginBottom: verticalScale(24)
	},
	description: {
		...sharedStyles.textRegular,
		fontSize: moderateScale(14),
		alignSelf: 'center',
		textAlign: 'center',
		marginHorizontal: 20
	},
	buttonsContainer: {
		marginBottom: verticalScale(10),
		marginTop: verticalScale(30)
	},
	closeModal: {
		position: 'absolute',
		left: 15
	}
});
