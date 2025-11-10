import React from 'react';
import ReactDOM from 'react-dom/client';
import LoginPage from './pages/LoginPage';
import ErrorPage from './pages/ErrorPage';
import SidebarPage from './pages/SidebarPage';
import DeviceViewPage from './pages/DeviceViewPage';

const root = ReactDOM.createRoot(
	document.getElementById('root') as HTMLElement
);

// declare window.__VSCODE_PAGE__ for typescript
declare global {
	interface Window {
		__VSCODE_PAGE__?: string;
	}
}

// read page from injected window variable (for vscode webview) or query parameter (for standalone)
const page = window.__VSCODE_PAGE__ || new URLSearchParams(window.location.search).get('page');

let PageComponent;
switch (page) {
	case 'device':
		PageComponent = DeviceViewPage;
		break;
	case 'sidebar':
		PageComponent = SidebarPage;
		break;
	case 'login':
		PageComponent = LoginPage;
		break;
	default:
		PageComponent = ErrorPage;
		break;
}

root.render(
	<React.StrictMode>
		<PageComponent />
	</React.StrictMode>
);
