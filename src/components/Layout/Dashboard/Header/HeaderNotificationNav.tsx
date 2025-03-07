import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/free-regular-svg-icons'
import {
  Nav,
  NavItem,
} from 'react-bootstrap'
import React, { PropsWithChildren } from 'react'
import { getDictionary, getLocale } from '@/locales/dictionary'
import HeaderTheme from '@/components/Layout/Dashboard/Header/HeaderTheme'
import { getPreferredTheme } from '@/themes/theme'

type ItemWithIconProps = {
  icon: IconDefinition;
} & PropsWithChildren

const ItemWithIcon = (props: ItemWithIconProps) => {
  const { icon, children } = props

  return (
    <>
      <FontAwesomeIcon className="me-2" icon={icon} fixedWidth />
      {children}
    </>
  )
}

export default async function HeaderNotificationNav() {
  const dict = await getDictionary()
  return (
    <Nav>
      <NavItem>
        <HeaderTheme currentPreferredTheme={getPreferredTheme()} />
      </NavItem>
    </Nav>
  )
}
