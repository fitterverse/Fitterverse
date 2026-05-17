'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  deleteToken,
  getNotificationPermissionState,
  getToken,
  requestPermissionAndGetToken,
} from '../lib/fcm-client'

type State = {
  permission: NotificationPermission | 'unsupported'
  token: string | null
  loading: boolean
}

const STORAGE_KEY = 'fv_fcm_token'

export function useNotificationPermission() {
  const [state, setState] = useState<State>({
    permission: 'default',
    token: null,
    loading: false,
  })

  // Sync permission state and restore cached token on mount
  useEffect(() => {
    const perm = getNotificationPermissionState()
    const cached = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    setState((s) => ({ ...s, permission: perm, token: cached }))
  }, [])

  const enable = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    const token = await requestPermissionAndGetToken()

    if (token) {
      localStorage.setItem(STORAGE_KEY, token)
      // Register token with server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
    }

    setState({
      permission: getNotificationPermissionState(),
      token,
      loading: false,
    })

    return token
  }, [])

  const disable = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    const cached = localStorage.getItem(STORAGE_KEY)

    if (cached) {
      await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cached }),
      })
      localStorage.removeItem(STORAGE_KEY)
      await deleteToken()
    }

    setState({ permission: getNotificationPermissionState(), token: null, loading: false })
  }, [])

  // Re-register token if permission is already granted but token is missing
  const refreshToken = useCallback(async () => {
    if (getNotificationPermissionState() !== 'granted') return
    const token = await getToken()
    if (token) {
      localStorage.setItem(STORAGE_KEY, token)
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      setState((s) => ({ ...s, token }))
    }
  }, [])

  return { ...state, enable, disable, refreshToken }
}
