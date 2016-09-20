/* eslint-disable */

import { PropTypes } from 'react';
import {
  requireNativeComponent,
  NativeModules,
  Platform,
} from 'react-native';

export const SUPPORTED = 'SUPPORTED';
export const USES_DEFAULT_IMPLEMENTATION = 'USES_DEFAULT_IMPLEMENTATION';
export const NOT_SUPPORTED = 'NOT_SUPPORTED';

export function getAirMapName(provider) {
  if (provider === 'google') return 'AIRGoogleMap';
  return 'AIRMap';
}

function getAirComponentName(provider, component) {
  return `${getAirMapName(provider)}${component}`;
}

export const contextTypes = {
  provider: PropTypes.string,
};

export const createNotSupportedComponent = message => () => console.error(message) || null;

export const googleMapIsInstalled = !!NativeModules.UIManager[getAirMapName('google')];

export default function decorateMapComponent(Component, { componentType, providers }) {
  const components = {
    default: requireNativeComponent(getAirComponentName(null, componentType), Component),
  };

  Object.entries(providers).forEach(([provider, providerInfo]) => {
    const platformSupport = providerInfo[Platform.OS];
    const componentName = getAirComponentName(provider, componentType);
    if (platformSupport === NOT_SUPPORTED) {
      components[provider] = createNotSupportedComponent(`react-native-maps: ${componentName} is not supported on ${Platform.OS}`);
    } else if (platformSupport === USES_DEFAULT_IMPLEMENTATION) {
      components[provider] = components.default;
    } else { // (platformSupport === SUPPORTED)
      if (Platform.OS === 'android' || (Platform.OS === 'ios' && googleMapIsInstalled)) {
        components[provider] = requireNativeComponent(componentName, Component);
      }
    }
  });

  Component.contextTypes = contextTypes;
  Component.prototype.airComponent = function() {
    return components[this.context.provider || 'default'];
  };

  Component.prototype.uiManagerCommand = function(name) {
    return NativeModules.UIManager[getAirComponentName(this.context.provider, componentType)]
      .Commands[name];
  };

  Component.prototype.mapManagerCommand = function(name) {
    return NativeModules[`${getAirComponentName(this.context.provider, componentType)}Manager`][name];
  };

  return Component;
}
