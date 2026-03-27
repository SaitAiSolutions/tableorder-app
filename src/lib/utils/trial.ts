export function isTrialExpired(trialEndsAt?: string | null) {
  if (!trialEndsAt) return false
  return new Date(trialEndsAt).getTime() < Date.now()
}

export function getRemainingTrialDays(trialEndsAt?: string | null) {
  if (!trialEndsAt) return null

  const diff = new Date(trialEndsAt).getTime() - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  return Math.max(days, 0)
}

export function formatTrialEndDate(trialEndsAt?: string | null) {
  if (!trialEndsAt) return null

  return new Date(trialEndsAt).toLocaleDateString('el-GR')
}

export function getTrialStatus(
  trialEndsAt?: string | null,
  subscriptionStatus?: string | null,
) {
  const isActiveSubscription = subscriptionStatus === 'active'
  const expired = isTrialExpired(trialEndsAt)
  const daysLeft = getRemainingTrialDays(trialEndsAt)

  return {
    expired,
    daysLeft,
    isActiveSubscription,
  }
}