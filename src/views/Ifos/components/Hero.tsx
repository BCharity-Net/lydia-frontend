import React from 'react'
import styled from 'styled-components'
import { Box, Heading, Text } from '@lydiafinance/uikit'
import Container from 'components/layout/Container'
import { useTranslation } from 'contexts/Localization'

const getGradient = (isDark: boolean) => {
  if (isDark) {
    return 'repeating-linear-gradient(to right, #332453, #332453 40px, #281D44 40px, #281D44 80px)'
  }

  return 'repeating-linear-gradient(to right, #ffef98, #ffef98 40px, #fcf4cc 40px, #fcf4cc 80px)'
}

const StyledHero = styled.div`
  background: ${({ theme }) => getGradient(theme.isDark)};
  padding-bottom: 40px;
  padding-top: 40px;
`

const CurtainBottom = styled.div`
  background-image: url('/images/curtain-bottom-${({ theme }) => (theme.isDark ? 'dark' : 'light')}.png');
  background-repeat: repeat-x;
  background-size: contain;
  height: 20px;
`

const Hero = () => {
  const { t } = useTranslation()

  return (
    <Box mb="32px">
      <StyledHero>
        <Container>
          <Heading as="h1" scale="xxl" color="text" mb="24px">
            {t('IFO: Initial Farm Offerings')}
          </Heading>
          <Text bold fontSize="20px">
            {t('Buy new tokens by staking LYD-LP.')}
          </Text>
          <Text bold fontSize="20px">
            {t('#1 Fair distribution on Avalanche')}
          </Text>
        </Container>
      </StyledHero>
      <CurtainBottom />
    </Box>
  )
}

export default Hero
