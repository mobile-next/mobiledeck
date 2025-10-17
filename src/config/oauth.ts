// shared oauth configuration for cognito authentication
export const OAUTH_CONFIG = {
	authority: "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_yxInzo34K",
	client_id: "5fuedu10rosgs7l68cup9g3pgv",
	redirect_uri: "https://mobilenexthq.com/oauth/callback/",
	response_type: "code",
	scope: "email openid",
	token_endpoint: "https://auth.mobilenexthq.com/oauth2/token",
	cognito_domain: "https://auth.mobilenexthq.com"
} as const;
