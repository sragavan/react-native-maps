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

export function airMapName(mapProvider) {
  if (mapProvider === 'google') return 'AIRGoogleMap';
  return 'AIRMap';
}

export function airComponentName(mapProvider, component) {
  return `${airMapName(mapProvider)}${component}`;
}

export const contextTypes = {
  mapProvider: PropTypes.string,
};

export const createNotSupportedComponent = message => () => console.error(message) || null;

export const AIRGoogleMapIsInstalled = !!NativeModules.UIManager[airMapName('google')];

export function decorateMapComponent(Component, { componentType, providers }) {
  const components = {
    default: requireNativeComponent(airComponentName(null, componentType), Component),
  };

  Object.entries(providers).forEach(([mapProvider, providerInfo]) => {
    const platformSupport = providerInfo[Platform.OS];
    const componentName = airComponentName(mapProvider, componentType);
    if (platformSupport === NOT_SUPPORTED) {
      components[mapProvider] = createNotSupportedComponent(`react-native-maps: ${componentName} is not supported on ${Platform.OS}`);
    } else if (platformSupport === USES_DEFAULT_IMPLEMENTATION) {
      components[mapProvider] = components.default;
    } else { // (platformSupport === SUPPORTED)
      if (Platform.OS === 'android' || (Platform.OS === 'ios' && AIRGoogleMapIsInstalled)) {
        components[mapProvider] = requireNativeComponent(componentName, Component);
      }
    }
  });

  Component.contextTypes = contextTypes;
  Component.prototype.airComponent = function() {
    return components[this.context.mapProvider || 'default'];
  };

  Component.prototype.uiManagerCommand = function(name) {
    return NativeModules.UIManager[airComponentName(this.context.mapProvider, componentType)]
      .Commands[name];
  };

  Component.prototype.mapManagerCommand = function(name) {
    return NativeModules[`${airComponentName(this.context.mapProvider, componentType)}Manager`][name];
  };

  return Component;
}
