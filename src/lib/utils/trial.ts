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

export function isTrialExpired(
  trialEndsAt: string | null | undefined,
  subscriptionStatus?: string | null,
) {
  return getTrialStatus(trialEndsAt, subscriptionStatus).expired
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