export function getTrialStatus(
  trialEndsAt: string | null | undefined,
  subscriptionStatus: string | null | undefined,
) {
  if (subscriptionStatus === 'active') {
    return {
      expired: false,
      isActiveSubscription: true,
      daysLeft: null as number | null,
    }
  }

  if (!trialEndsAt) {
    return {
      expired: false,
      isActiveSubscription: false,
      daysLeft: null as number | null,
    }
  }

  const now = new Date()
  const end = new Date(trialEndsAt)

  if (Number.isNaN(end.getTime())) {
    return {
      expired: false,
      isActiveSubscription: false,
      daysLeft: null as number | null,
    }
  }

  const diffMs = end.getTime() - now.getTime()
  const expired = diffMs < 0
  const daysLeft = expired ? 0 : Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  return {
    expired,
    isActiveSubscription: false,
    daysLeft,
  }
}

export function formatTrialEndDate(trialEndsAt: string | null | undefined) {
  if (!trialEndsAt) return null

  const date = new Date(trialEndsAt)

  if (Number.isNaN(date.getTime())) return null

  return date.toLocaleDateString('el-GR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function canBusinessUseApp(
  accountStatus: string | null | undefined,
  trialEndsAt: string | null | undefined,
  subscriptionStatus: string | null | undefined,
) {
  if (accountStatus === 'active' && subscriptionStatus === 'active') {
    return true
  }

  if (accountStatus === 'grace_period') {
    return true
  }

  if (accountStatus === 'trialing' && subscriptionStatus === 'trialing') {
    const trial = getTrialStatus(trialEndsAt, subscriptionStatus)
    return !trial.expired
  }

  return false
}

export function getBusinessLockReason(
  accountStatus: string | null | undefined,
  trialEndsAt: string | null | undefined,
  subscriptionStatus: string | null | undefined,
) {
  if (accountStatus === 'suspended') return 'suspended'
  if (accountStatus === 'cancelled') return 'cancelled'

  const allowed = canBusinessUseApp(accountStatus, trialEndsAt, subscriptionStatus)
  if (allowed) return null

  const trial = getTrialStatus(trialEndsAt, subscriptionStatus)
  if (trial.expired) return 'trial_expired'

  return 'inactive'
}