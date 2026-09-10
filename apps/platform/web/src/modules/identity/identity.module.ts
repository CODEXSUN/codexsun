import type { PlatformWebModule } from '@codexsun/platform-core-web'
import type { FC } from 'react'
import {
  AdminPasswordForgotPage,
  ClientPasswordForgotPage,
  IdentityRegisterPage,
  SuperAdminPasswordForgotPage,
} from './identity.account-pages'
import {
  AdminIdentityLogin,
  ClientIdentityLogin,
  SuperAdminIdentityLogin,
} from './identity.login-pages'
import {
  AdminIdentityPortal,
  ClientIdentityPortal,
  SuperAdminIdentityPortal,
} from './identity.portal-pages'

export const identityWebModule: PlatformWebModule<FC> = {
  id: 'identity',
  navigation: [],
  routes: [
    { component: ClientIdentityPortal, id: 'identity.client', path: '/', title: 'Workspace' },
    {
      component: ClientIdentityLogin,
      id: 'identity.client.login',
      path: '/login',
      title: 'Sign in',
    },
    {
      component: IdentityRegisterPage,
      id: 'identity.register',
      path: '/register',
      title: 'Register',
    },
    {
      component: ClientPasswordForgotPage,
      id: 'identity.forgot',
      path: '/password/forgot',
      title: 'Reset password',
    },
    {
      component: AdminIdentityPortal,
      id: 'identity.admin',
      path: '/admin',
      title: 'Administrator',
    },
    {
      component: AdminIdentityLogin,
      id: 'identity.admin.login',
      path: '/admin/login',
      title: 'Administrator sign in',
    },
    {
      component: AdminPasswordForgotPage,
      id: 'identity.admin.forgot',
      path: '/admin/password/forgot',
      title: 'Reset password',
    },
    {
      component: SuperAdminIdentityPortal,
      id: 'identity.sa',
      path: '/sa',
      title: 'Super administrator',
    },
    {
      component: SuperAdminIdentityLogin,
      id: 'identity.sa.login',
      path: '/sa/login',
      title: 'Super administrator sign in',
    },
    {
      component: SuperAdminPasswordForgotPage,
      id: 'identity.sa.forgot',
      path: '/sa/password/forgot',
      title: 'Reset password',
    },
  ],
  version: '1.1.2',
}
