import React from 'react';
import ReactDOM from 'react-dom/client';
import DeviceViewPage from './DeviceViewPage';
import SidebarPage from './SidebarPage';
import ErrorPage from './ErrorPage';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// read query parameter to determine which page to render
const params = new URLSearchParams(window.location.search);
const page = params.get('page');

let PageComponent;
switch (page) {
  case 'device':
    PageComponent = DeviceViewPage;
    break;
  case 'sidebar':
    PageComponent = SidebarPage;
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