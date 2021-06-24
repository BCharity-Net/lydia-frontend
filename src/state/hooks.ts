import { useEffect, useMemo } from 'react'
import BigNumber from 'bignumber.js'
import { kebabCase } from 'lodash'
import { useWeb3React } from '@web3-react/core'
import { Toast, toastTypes } from '@lydiafinance/uikit'
import { useSelector, useDispatch } from 'react-redux'
import { Team } from 'config/constants/types'
import { getWeb3NoAccount } from 'utils/web3'
import useRefresh from 'hooks/useRefresh'
import {
  fetchFarmsPublicDataAsync,
  fetchPoolsPublicDataAsync,
  fetchPoolsUserDataAsync,
  fetchMaximusPublicDataAsync,
  fetchMaximusUserDataAsync,
  push as pushToast,
  remove as removeToast,
  clear as clearToast,
  setBlock,
} from './actions'
import { QuoteToken } from '../config/constants/types'
import { State, Farm, Pool, ProfileState, TeamsState, AchievementState, PriceState, FarmsState, Maximus } from './types'
// import { fetchProfile } from './profile'
import { fetchTeam, fetchTeams } from './teams'
import { fetchAchievements } from './achievements'
import { fetchPrices } from './prices'

export const useFetchPublicData = () => {
  const dispatch = useDispatch()
  const { slowRefresh } = useRefresh()
  useEffect(() => {
    dispatch(fetchFarmsPublicDataAsync())
    dispatch(fetchPoolsPublicDataAsync())
    dispatch(fetchMaximusPublicDataAsync())
  }, [dispatch, slowRefresh])

  useEffect(() => {
    const web3 = getWeb3NoAccount()
    const interval = setInterval(async () => {
      const blockNumber = await web3.eth.getBlockNumber()
      dispatch(setBlock(blockNumber))
    }, 6000)

    return () => clearInterval(interval)
  }, [dispatch])
}

// Farms

export const useFarms = (): FarmsState => {
  const farms = useSelector((state: State) => {
    return state.farms
  })
  return farms
}

export const useFarmFromPid = (pid): Farm => {
  const farm = useSelector((state: State) => state.farms.data.find((f) => f.pid === pid))
  return farm
}

export const useFarmFromSymbol = (lpSymbol: string): Farm => {
  const farm = useSelector((state: State) => state.farms.data.find((f) => f.lpSymbol === lpSymbol))
  return farm
}

export const useFarmUser = (pid) => {
  const farm = useFarmFromPid(pid)
  const avaxPrice = useAvaxPriceUsdt()
  const lydPrice = usePriceLydUsdt()

  const stakedBalance = farm.userData ? new BigNumber(farm.userData.stakedBalance) : new BigNumber(0)

  const stakedInQuoteToken = stakedBalance.dividedBy(farm?.lpTokenBalanceMC).multipliedBy(farm.lpTotalInQuoteToken)
  let stakedUsd = new BigNumber(0)

  if (farm.quoteTokenSymbol === QuoteToken.AVAX) {
    stakedUsd = avaxPrice.times(stakedInQuoteToken)
  } else if (farm.quoteTokenSymbol === QuoteToken.LYD) {
    stakedUsd = lydPrice.times(stakedInQuoteToken)
  }

  return {
    allowance: farm.userData ? new BigNumber(farm.userData.allowance) : new BigNumber(0),
    tokenBalance: farm.userData ? new BigNumber(farm.userData.tokenBalance) : new BigNumber(0),
    stakedBalance: farm.userData ? new BigNumber(farm.userData.stakedBalance) : new BigNumber(0),
    earnings: farm.userData ? new BigNumber(farm.userData.earnings) : new BigNumber(0),
    stakedUsd,
  }
}

// Pools

export const usePools = (account): Pool[] => {
  const { fastRefresh } = useRefresh()
  const dispatch = useDispatch()
  useEffect(() => {
    if (account) {
      dispatch(fetchPoolsUserDataAsync(account))
    }
  }, [account, dispatch, fastRefresh])

  const pools = useSelector((state: State) => state.pools.data)
  return pools
}

export const usePoolFromPid = (sousId): Pool => {
  const pool = useSelector((state: State) => state.pools.data.find((p) => p.sousId === sousId))
  return pool
}

// Maximus

export const useMaximusPools = (account): Maximus[] => {
  const { fastRefresh } = useRefresh()
  const dispatch = useDispatch()
  const avaxPrice = useAvaxPriceUsdt()
  const lydPrice = usePriceLydUsdt()
  useEffect(() => {
    if (account) {
      dispatch(fetchMaximusUserDataAsync(account))
    }
  }, [account, dispatch, fastRefresh])

  const maximus = useSelector((state: State) => state.maximus.data).map((farm) => {
    let stakedUsd = new BigNumber(0)
    const stakedBalance = farm.userData ? new BigNumber(farm.userData.stakedBalance) : new BigNumber(0)

    const stakedInQuoteToken = stakedBalance.dividedBy(farm?.lpTokenBalanceMC).multipliedBy(farm.lpTotalInQuoteToken)

    if (farm.quoteTokenSymbol === QuoteToken.AVAX) {
      stakedUsd = avaxPrice.times(stakedInQuoteToken)
    } else if (farm.quoteTokenSymbol === QuoteToken.LYD) {
      stakedUsd = lydPrice.times(stakedInQuoteToken)
    }

    return {
      ...farm,
      userData: {
        ...farm.userData,
        stakedBalance,
        pendingReward: farm.userData ? new BigNumber(farm.userData.pendingReward) : new BigNumber(0),
        allowance: farm.userData ? new BigNumber(farm.userData.allowance) : new BigNumber(0),
        stakedUsd,
      },
    }
  })

  return maximus
}

// Toasts
export const useToast = () => {
  const dispatch = useDispatch()
  const helpers = useMemo(() => {
    const push = (toast: Toast) => dispatch(pushToast(toast))

    return {
      toastError: (title: string, description?: string) => {
        return push({ id: kebabCase(title), type: toastTypes.DANGER, title, description })
      },
      toastInfo: (title: string, description?: string) => {
        return push({ id: kebabCase(title), type: toastTypes.INFO, title, description })
      },
      toastSuccess: (title: string, description?: string) => {
        return push({ id: kebabCase(title), type: toastTypes.SUCCESS, title, description })
      },
      toastWarning: (title: string, description?: string) => {
        return push({ id: kebabCase(title), type: toastTypes.WARNING, title, description })
      },
      push,
      remove: (id: string) => dispatch(removeToast(id)),
      clear: () => dispatch(clearToast()),
    }
  }, [dispatch])

  return helpers
}

// Profile

export const useFetchProfile = () => {
  // const { account } = useWeb3React()
  // const dispatch = useDispatch()
  // useEffect(() => {
  //   dispatch(fetchProfile(account))
  // }, [account, dispatch])
}

export const useProfile = () => {
  const { isInitialized, isLoading, data, hasRegistered }: ProfileState = useSelector((state: State) => state.profile)
  return { profile: data, hasProfile: isInitialized && hasRegistered, isInitialized, isLoading }
}

// Teams

export const useTeam = (id: number) => {
  const team: Team = useSelector((state: State) => state.teams.data[id])
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchTeam(id))
  }, [id, dispatch])

  return team
}

export const useTeams = () => {
  const { isInitialized, isLoading, data }: TeamsState = useSelector((state: State) => state.teams)
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchTeams())
  }, [dispatch])

  return { teams: data, isInitialized, isLoading }
}

// Achievements

export const useFetchAchievements = () => {
  const { account } = useWeb3React()
  const dispatch = useDispatch()

  useEffect(() => {
    if (account) {
      dispatch(fetchAchievements(account))
    }
  }, [account, dispatch])
}

export const useAchievements = () => {
  const achievements: AchievementState['data'] = useSelector((state: State) => state.achievements.data)
  return achievements
}

// Prices
export const useFetchPriceList = () => {
  const { fastRefresh } = useRefresh()
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchPrices())
  }, [dispatch, fastRefresh])
}

export const useGetApiPrices = () => {
  const prices: PriceState['data'] = useSelector((state: State) => state.prices.data)

  if (prices) {
    // Workaround for olive electrum pool
    return { ...prices, olive: 0.158 }
  }

  return prices
}

export const useGetApiPrice = (token: string) => {
  const prices = useGetApiPrices()

  if (!prices) {
    return null
  }

  return prices[token.toLowerCase()]
}

export const usePriceLydUsdt = (): BigNumber => {
  const ZERO = new BigNumber(0)
  const lydAvaxFarm = useFarmFromPid(4)
  const avaxUsdtFarm = useFarmFromPid(1)

  const avaxUsdtPrice = avaxUsdtFarm?.tokenPriceVsQuote ? new BigNumber(1).div(avaxUsdtFarm?.tokenPriceVsQuote) : ZERO
  const lydUsdtPrice = lydAvaxFarm?.tokenPriceVsQuote ? avaxUsdtPrice.times(lydAvaxFarm?.tokenPriceVsQuote) : ZERO

  return lydUsdtPrice
}

export const useAvaxPriceUsdt = (): BigNumber => {
  const ZERO = new BigNumber(0)
  const avaxUsdtFarm = useFarmFromPid(1)

  const avaxUsdtPrice = avaxUsdtFarm?.tokenPriceVsQuote ? new BigNumber(1).div(avaxUsdtFarm?.tokenPriceVsQuote) : ZERO

  return avaxUsdtPrice
}

// Block
export const useBlock = () => {
  return useSelector((state: State) => state.block)
}

export const useInitialBlock = () => {
  return useSelector((state: State) => state.block.initialBlock)
}
