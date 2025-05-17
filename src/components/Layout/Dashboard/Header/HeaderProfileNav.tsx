import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Nav,
  NavItem,
} from 'react-bootstrap'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { PropsWithChildren } from 'react'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
faPowerOff,
} from '@fortawesome/free-solid-svg-icons'
import HeaderLogout from '@/components/Layout/Dashboard/Header/HeaderLogout'
import { authOptions } from '@/app/api/auth/option'
import { getServerSession } from 'next-auth'
import { getDictionary } from '@/locales/dictionary'

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

export default async function HeaderProfileNav() {
  const session = await getServerSession(authOptions)
  const dict = await getDictionary()

  return (
    <Nav>
      <Dropdown as={NavItem}>
      {session?.user?.email && (
      <span>{session.user.email}</span>
      )}
        <DropdownToggle variant="link" bsPrefix="hide-caret" className="py-0 px-2 rounded-0" id="dropdown-profile">
          <div className="avatar position-relative">
            
            {session?.user?.email && (
              <Image
                fill
                sizes="32px"
                className="rounded-circle"
                src="/27470336_7294793.jpg"
                alt={session.user.email}
              />
            )}
          </div>
        </DropdownToggle>
        <DropdownMenu className="pt-0">
          <HeaderLogout>
            <DropdownItem>
              <ItemWithIcon icon={faPowerOff}>{dict.profile.logout}</ItemWithIcon>
            </DropdownItem>
          </HeaderLogout>
        </DropdownMenu>
      </Dropdown>
    </Nav>
  )
}
