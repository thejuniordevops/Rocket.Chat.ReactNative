import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, View, ScrollView, Image, StyleSheet, Animated, Easing, Keyboard
} from 'react-native';
import { connect } from 'react-redux';
import { Base64 } from 'js-base64';
import { SafeAreaView } from 'react-navigation';
import { BorderlessButton } from 'react-native-gesture-handler';
import equal from 'deep-equal';

import { analytics } from '../utils/log';
import Touch from '../utils/touch';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import random from '../utils/random';
import Button from '../containers/Button';
import I18n from '../i18n';
import { LegalButton } from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { themes } from '../constants/colors';
import { withTheme } from '../theme';
import { themedHeader } from '../utils/navigation';
import { isTablet } from '../utils/deviceInfo';
import FormContainer, { FormContainerInner } from '../containers/FormContainer';
import OnboardingSeparator from '../containers/OnboardingSeparator';
import TextInput from '../containers/TextInput';

import { loginRequest as loginRequestAction } from '../actions/login';
import { animateNextTransition } from '../utils/layoutAnimation';

const styles = StyleSheet.create({
	container: {
		paddingVertical: 30
	},
	safeArea: {
		paddingBottom: 30,
		flex: 1
	},
	serviceButton: {
		borderRadius: 2,
		marginBottom: 10
	},
	serviceButtonContainer: {
		borderRadius: 2,
		width: '100%',
		height: 48,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 15
	},
	serviceIcon: {
		position: 'absolute',
		left: 15,
		top: 12,
		width: 24,
		height: 24
	},
	serviceText: {
		...sharedStyles.textRegular,
		fontSize: 16
	},
	serviceName: {
		...sharedStyles.textSemibold
	},
	registerDisabled: {
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter,
		fontSize: 16
	},
	servicesTogglerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 5,
		marginBottom: 30
	},
	servicesToggler: {
		width: 32,
		height: 31
	},
	separatorContainer: {
		marginTop: 5,
		marginBottom: 15
	},
	separatorLine: {
		flex: 1,
		height: 1
	},
	separatorLineLeft: {
		marginRight: 15
	},
	separatorLineRight: {
		marginLeft: 15
	},
	inverted: {
		transform: [{ scaleY: -1 }]
	},
	title: {
		...sharedStyles.textBold,
		fontSize: 22
	},
	inputContainer: {
		marginVertical: 16
	},
	bottomContainer: {
		flexDirection: 'column',
		alignItems: 'center',
		marginBottom: 32
	},
	dontHaveAccount: {
		...sharedStyles.textRegular,
		fontSize: 13
	},
	createAccount: {
		...sharedStyles.textSemibold,
		fontSize: 13
	},

});

const SERVICE_HEIGHT = 58;
const SERVICES_COLLAPSED_HEIGHT = 174;

class LoginView extends React.Component {
	static navigationOptions = ({ navigation, screenProps }) => {
		const title = navigation.getParam('title', 'Rocket.Chat');
		return {
			...themedHeader(screenProps.theme),
			title,
			headerRight: <LegalButton testID='welcome-view-more' navigation={navigation} />
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		server: PropTypes.string,
		services: PropTypes.object,
		Site_Name: PropTypes.string,
		Gitlab_URL: PropTypes.string,
		CAS_enabled: PropTypes.bool,
		CAS_login_url: PropTypes.string,
		Accounts_ShowFormLogin: PropTypes.bool,
		Accounts_RegistrationForm: PropTypes.string,
		Accounts_RegistrationForm_LinkReplacementText: PropTypes.string,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			collapsed: true,
			servicesHeight: new Animated.Value(SERVICES_COLLAPSED_HEIGHT),
			user: '',
			password: '',
			code: '',
			showTOTP: false
		};
		const { Site_Name } = this.props;
		this.setTitle(Site_Name);
	}

	// shouldComponentUpdate(nextProps, nextState) {
	// 	const { collapsed, servicesHeight } = this.state;
	// 	const {
	// 		server, Site_Name, services, Accounts_ShowFormLogin, Accounts_RegistrationForm, Accounts_RegistrationForm_LinkReplacementText, theme
	// 	} = this.props;
	// 	if (nextState.collapsed !== collapsed) {
	// 		return true;
	// 	}
	// 	if (nextState.servicesHeight !== servicesHeight) {
	// 		return true;
	// 	}
	// 	if (nextProps.server !== server) {
	// 		return true;
	// 	}
	// 	if (nextProps.Site_Name !== Site_Name) {
	// 		return true;
	// 	}
	// 	if (nextProps.theme !== theme) {
	// 		return true;
	// 	}
	// 	if (nextProps.Accounts_ShowFormLogin !== Accounts_ShowFormLogin) {
	// 		return true;
	// 	}
	// 	if (nextProps.Accounts_RegistrationForm !== Accounts_RegistrationForm) {
	// 		return true;
	// 	}
	// 	if (nextProps.Accounts_RegistrationForm_LinkReplacementText !== Accounts_RegistrationForm_LinkReplacementText) {
	// 		return true;
	// 	}
	// 	if (!equal(nextProps.services, services)) {
	// 		return true;
	// 	}
	// 	return false;
	// }

	componentDidUpdate(prevProps) {
		const { Site_Name } = this.props;
		if (Site_Name && prevProps.Site_Name !== Site_Name) {
			this.setTitle(Site_Name);
		}
	}

	setTitle = (title) => {
		const { navigation } = this.props;
		navigation.setParams({ title });
	}

	onPressFacebook = () => {
		const { services, server } = this.props;
		const { clientId } = services.facebook;
		const endpoint = 'https://m.facebook.com/v2.9/dialog/oauth';
		const redirect_uri = `${ server }/_oauth/facebook?close`;
		const scope = 'email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&display=touch`;
		this.openOAuth({ url: `${ endpoint }${ params }` });
	}

	onPressGithub = () => {
		const { services, server } = this.props;
		const { clientId } = services.github;
		const endpoint = `https://github.com/login?client_id=${ clientId }&return_to=${ encodeURIComponent('/login/oauth/authorize') }`;
		const redirect_uri = `${ server }/_oauth/github?close`;
		const scope = 'user:email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }`;
		this.openOAuth({ url: `${ endpoint }${ encodeURIComponent(params) }` });
	}

	onPressGitlab = () => {
		const { services, server, Gitlab_URL } = this.props;
		const { clientId } = services.gitlab;
		const baseURL = Gitlab_URL ? Gitlab_URL.trim().replace(/\/*$/, '') : 'https://gitlab.com';
		const endpoint = `${ baseURL }/oauth/authorize`;
		const redirect_uri = `${ server }/_oauth/gitlab?close`;
		const scope = 'read_user';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth({ url: `${ endpoint }${ params }` });
	}

	onPressGoogle = () => {
		const { services, server } = this.props;
		const { clientId } = services.google;
		const endpoint = 'https://accounts.google.com/o/oauth2/auth';
		const redirect_uri = `${ server }/_oauth/google?close`;
		const scope = 'email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth({ url: `${ endpoint }${ params }` });
	}

	onPressLinkedin = () => {
		const { services, server } = this.props;
		const { clientId } = services.linkedin;
		const endpoint = 'https://www.linkedin.com/oauth/v2/authorization';
		const redirect_uri = `${ server }/_oauth/linkedin?close`;
		const scope = 'r_liteprofile,r_emailaddress';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth({ url: `${ endpoint }${ params }` });
	}

	onPressMeteor = () => {
		const { services, server } = this.props;
		const { clientId } = services['meteor-developer'];
		const endpoint = 'https://www.meteor.com/oauth2/authorize';
		const redirect_uri = `${ server }/_oauth/meteor-developer`;
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&state=${ state }&response_type=code`;
		this.openOAuth({ url: `${ endpoint }${ params }` });
	}

	onPressTwitter = () => {
		const { server } = this.props;
		const state = this.getOAuthState();
		const url = `${ server }/_oauth/twitter/?requestTokenAndRedirect=true&state=${ state }`;
		this.openOAuth({ url });
	}

	onPressWordpress = () => {
		const { services, server } = this.props;
		const { clientId, serverURL } = services.wordpress;
		const endpoint = `${ serverURL }/oauth/authorize`;
		const redirect_uri = `${ server }/_oauth/wordpress?close`;
		const scope = 'openid';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth({ url: `${ endpoint }${ params }` });
	}

	onPressCustomOAuth = (loginService) => {
		const { server } = this.props;
		const {
			serverURL, authorizePath, clientId, scope, service
		} = loginService;
		const redirectUri = `${ server }/_oauth/${ service }`;
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirectUri }&response_type=code&state=${ state }&scope=${ scope }`;
		const domain = `${ serverURL }`;
		const absolutePath = `${ authorizePath }${ params }`;
		const url = absolutePath.includes(domain) ? absolutePath : domain + absolutePath;
		this.openOAuth({ url });
	}

	onPressSaml = (loginService) => {
		const { server } = this.props;
		const {	clientConfig } = loginService;
		const {	provider } = clientConfig;
		const ssoToken = random(17);
		const url = `${ server }/_saml/authorize/${ provider }/${ ssoToken }`;
		this.openOAuth({ url, ssoToken, authType: 'saml' });
	}

	onPressCas = () => {
		const { server, CAS_login_url } = this.props;
		const ssoToken = random(17);
		const url = `${ CAS_login_url }?service=${ server }/_cas/${ ssoToken }`;
		this.openOAuth({ url, ssoToken, authType: 'cas' });
	}

	getOAuthState = () => {
		const credentialToken = random(43);
		return Base64.encodeURI(JSON.stringify({ loginStyle: 'popup', credentialToken, isCordova: true }));
	}

	openOAuth = ({ url, ssoToken, authType = 'oauth' }) => {
		const { navigation } = this.props;
		navigation.navigate('AuthenticationWebView', { url, authType, ssoToken });
	}

	login = () => {
		const { navigation, Site_Name } = this.props;
		navigation.navigate('LoginView', { title: Site_Name });
	}

	register = () => {
		const { navigation, Site_Name } = this.props;
		navigation.navigate('RegisterView', { title: Site_Name });
	}

	forgotPassword = () => {
		const { navigation, Site_Name } = this.props;
		navigation.navigate('ForgotPasswordView', { title: Site_Name });
	}

	transitionServicesTo = (height) => {
		const { servicesHeight } = this.state;
		if (this._animation) {
			this._animation.stop();
		}
		this._animation = Animated.timing(servicesHeight, {
			toValue: height,
			duration: 300,
			easing: Easing.easeOutCubic
		}).start();
	}

	toggleServices = () => {
		const { collapsed } = this.state;
		const { services } = this.props;
		const { length } = Object.values(services);
		if (collapsed) {
			this.transitionServicesTo(SERVICE_HEIGHT * length);
		} else {
			this.transitionServicesTo(SERVICES_COLLAPSED_HEIGHT);
		}
		this.setState(prevState => ({ collapsed: !prevState.collapsed }));
	}

	getSocialOauthProvider = (name) => {
		const oauthProviders = {
			facebook: this.onPressFacebook,
			github: this.onPressGithub,
			gitlab: this.onPressGitlab,
			google: this.onPressGoogle,
			linkedin: this.onPressLinkedin,
			'meteor-developer': this.onPressMeteor,
			twitter: this.onPressTwitter,
			wordpress: this.onPressWordpress
		};
		return oauthProviders[name];
	}

	valid = () => {
		const {
			user, password, code, showTOTP
		} = this.state;
		if (showTOTP) {
			return code.trim();
		}
		return user.trim() && password.trim();
	}

	submit = () => {
		if (!this.valid()) {
			return;
		}

		const { user, password, code } = this.state;
		const { loginRequest } = this.props;
		Keyboard.dismiss();
		loginRequest({ user, password, code });
		analytics().logEvent('login');
	}

	renderServicesSeparator = () => {
		const { collapsed } = this.state;
		const {
			services, theme, Accounts_ShowFormLogin, Accounts_RegistrationForm
		} = this.props;
		const { length } = Object.values(services);

		if (length > 3 && Accounts_ShowFormLogin && Accounts_RegistrationForm) {
			return (
				<>
					<Button
						title={collapsed ? 'More options' : 'Less options'}
						type='secondary'
						onPress={this.toggleServices}
						theme={theme}
						style={{ marginBottom: 0 }}
						color={themes[theme].actionTintColor}
					/>
					<OnboardingSeparator theme={theme} />
				</>
			);
		}
		if (length > 0) {
			return <OnboardingSeparator theme={theme} />;
		}
		return null;
	}

	renderItem = (service) => {
		let { name } = service;
		name = name === 'meteor-developer' ? 'meteor' : name;
		const icon = `icon_${ name }`;
		const isSaml = service.service === 'saml';
		let onPress = () => {};

		switch (service.authType) {
			case 'oauth': {
				onPress = this.getSocialOauthProvider(service.name);
				break;
			}
			case 'oauth_custom': {
				onPress = () => this.onPressCustomOAuth(service);
				break;
			}
			case 'saml': {
				onPress = () => this.onPressSaml(service);
				break;
			}
			case 'cas': {
				onPress = () => this.onPressCas();
				break;
			}
			default:
				break;
		}
		name = name.charAt(0).toUpperCase() + name.slice(1);
		const { CAS_enabled, theme } = this.props;
		let buttonText;
		if (isSaml || (service.service === 'cas' && CAS_enabled)) {
			buttonText = <Text style={[styles.serviceName, isSaml && { color: service.buttonLabelColor }]}>{name}</Text>;
		} else {
			buttonText = (
				<>
					{I18n.t('Continue_with')} <Text style={styles.serviceName}>{name}</Text>
				</>
			);
		}

		const backgroundColor = isSaml && service.buttonColor ? service.buttonColor : themes[theme].chatComponentBackground;

		return (
			<Touch
				key={service.name}
				onPress={onPress}
				style={[styles.serviceButton, { backgroundColor }]}
				theme={theme}
				activeOpacity={0.5}
				underlayColor={themes[theme].buttonText}
			>
				<View style={styles.serviceButtonContainer}>
					{service.authType === 'oauth' ? <Image source={{ uri: icon }} style={styles.serviceIcon} /> : null}
					<Text style={[styles.serviceText, { color: themes[theme].titleText }]}>{buttonText}</Text>
				</View>
			</Touch>
		);
	}

	renderServices = () => {
		const { servicesHeight } = this.state;
		const { services, Accounts_ShowFormLogin, Accounts_RegistrationForm } = this.props;
		const { length } = Object.values(services);
		const style = {
			overflow: 'hidden',
			height: servicesHeight
		};

		if (length > 3 && Accounts_ShowFormLogin && Accounts_RegistrationForm) {
			return (
				<Animated.View style={style}>
					{Object.values(services).map(service => this.renderItem(service))}
				</Animated.View>
			);
		}
		return (
			<View>
				{Object.values(services).map(service => this.renderItem(service))}
			</View>
		);
	}

	renderLogin = () => {
		const { Accounts_ShowFormLogin, theme } = this.props;
		if (!Accounts_ShowFormLogin) {
			return null;
		}
		return (
			<Button
				title={<Text>{I18n.t('Login_with')} <Text style={{ ...sharedStyles.textBold }}>{I18n.t('email')}</Text></Text>}
				type='primary'
				onPress={() => this.login()}
				theme={theme}
				testID='welcome-view-login'
			/>
		);
	}

	renderRegister = () => {
		const { Accounts_RegistrationForm, Accounts_RegistrationForm_LinkReplacementText, theme } = this.props;
		if (Accounts_RegistrationForm !== 'Public') {
			return <Text style={[styles.registerDisabled, { color: themes[theme].auxiliaryText }]}>{Accounts_RegistrationForm_LinkReplacementText}</Text>;
		}
		return (
			<Button
				title={I18n.t('Create_account')}
				type='secondary'
				onPress={() => this.register()}
				theme={theme}
				testID='welcome-view-register'
			/>
		);
	}

	renderUserForm = () => {
		const {
			Accounts_EmailOrUsernamePlaceholder, Accounts_PasswordPlaceholder, Accounts_PasswordReset, Accounts_RegistrationForm, Accounts_RegistrationForm_LinkReplacementText, isFetching, theme
		} = this.props;
		return (
			<>
				<Text style={[styles.title, sharedStyles.textBold, { color: themes[theme].titleText }]}>{I18n.t('Login')}</Text>
				<TextInput
					label='Email or username'
					containerStyle={styles.inputContainer}
					placeholder={Accounts_EmailOrUsernamePlaceholder || I18n.t('Username_or_email')}
					keyboardType='email-address'
					returnKeyType='next'
					iconLeft='at'
					onChangeText={value => this.setState({ user: value })}
					onSubmitEditing={() => { this.passwordInput.focus(); }}
					testID='login-view-email'
					textContentType='username'
					autoCompleteType='username'
					theme={theme}
				/>
				<TextInput
					label='Password'
					containerStyle={styles.inputContainer}
					inputRef={(e) => { this.passwordInput = e; }}
					placeholder={Accounts_PasswordPlaceholder || I18n.t('Password')}
					returnKeyType='send'
					iconLeft='key'
					secureTextEntry
					onSubmitEditing={this.submit}
					onChangeText={value => this.setState({ password: value })}
					testID='login-view-password'
					textContentType='password'
					autoCompleteType='password'
					theme={theme}
				/>
				<Button
					title={I18n.t('Login')}
					type='primary'
					onPress={this.submit}
					testID='login-view-submit'
					loading={isFetching}
					disabled={!this.valid()}
					theme={theme}
					style={{ marginTop: 16 }}
				/>
				{Accounts_PasswordReset && (
					<Button
						title={I18n.t('Forgot_password')}
						type='secondary'
						onPress={this.forgotPassword}
						testID='login-view-forgot-password'
						theme={theme}
						color={themes[theme].auxiliaryText}
						fontSize={14}
					/>
				)}
				{Accounts_RegistrationForm === 'Public' ? (
					<View style={styles.bottomContainer}>
						<Text style={[styles.dontHaveAccount, { color: themes[theme].auxiliaryText }]}>{I18n.t('Dont_Have_An_Account')}</Text>
						<Text
							style={[styles.createAccount, { color: themes[theme].actionTintColor }]}
							onPress={this.register}
							testID='login-view-register'
						>{I18n.t('Create_account')}
						</Text>
					</View>
				) : (<Text style={[styles.registerDisabled, { color: themes[theme].auxiliaryText }]}>{Accounts_RegistrationForm_LinkReplacementText}</Text>)}
			</>
		);
	}

	render() {
		const { showTOTP } = this.state;
		const { theme } = this.props;
		return (
			<FormContainer theme={theme}>
				<FormContainerInner>
					{!showTOTP ? this.renderServices() : null}
					{!showTOTP ? this.renderServicesSeparator() : null}
					{!showTOTP ? this.renderUserForm() : null}
					{showTOTP ? this.renderTOTP() : null}
				</FormContainerInner>
			</FormContainer>
		);
	}
}

const mapStateToProps = state => ({
	server: state.server.server,
	Site_Name: state.settings.Site_Name,
	Gitlab_URL: state.settings.API_Gitlab_URL,
	CAS_enabled: state.settings.CAS_enabled,
	CAS_login_url: state.settings.CAS_login_url,
	Accounts_ShowFormLogin: state.settings.Accounts_ShowFormLogin,
	Accounts_RegistrationForm: state.settings.Accounts_RegistrationForm,
	Accounts_RegistrationForm_LinkReplacementText: state.settings.Accounts_RegistrationForm_LinkReplacementText,
	services: state.login.services,
	isFetching: state.login.isFetching,
	failure: state.login.failure,
	error: state.login.error && state.login.error.data,
	// Site_Name: state.settings.Site_Name,
	Accounts_EmailOrUsernamePlaceholder: state.settings.Accounts_EmailOrUsernamePlaceholder,
	Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder,
	// Accounts_RegistrationForm: state.settings.Accounts_RegistrationForm,
	// Accounts_RegistrationForm_LinkReplacementText: state.settings.Accounts_RegistrationForm_LinkReplacementText,
	Accounts_PasswordReset: state.settings.Accounts_PasswordReset
});

const mapDispatchToProps = dispatch => ({
	loginRequest: params => dispatch(loginRequestAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(LoginView));
