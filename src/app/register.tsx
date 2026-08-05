import React from 'react';
import { Redirect } from 'expo-router';

export default function RegisterRoute() {
  return <Redirect href={{ pathname: '/main-login', params: { screen: 'signup' } }} />;
}
