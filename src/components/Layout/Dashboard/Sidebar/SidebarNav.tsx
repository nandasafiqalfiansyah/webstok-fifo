import {
  faUser,
} from '@fortawesome/free-regular-svg-icons'
import {
  faBucket,
  faHome,
  faIndent,
  faOutdent,
} from '@fortawesome/free-solid-svg-icons'
import React, { PropsWithChildren } from 'react'
import SidebarNavItem from '@/components/Layout/Dashboard/Sidebar/SidebarNavItem'
import { getDictionary } from '@/locales/dictionary'

const SidebarNavTitle = (props: PropsWithChildren) => {
  const { children } = props

  return (
    <li className="nav-title px-3 py-2 mt-3 text-uppercase fw-bold">{children}</li>
  )
}

export default async function SidebarNav() {
  const dict = await getDictionary()
  return (
    <ul className="list-unstyled mt-3">
      <SidebarNavItem icon={faHome} href={`${process.env.NEXT_PUBLIC_API_URL}`}>
        Dashboard
      </SidebarNavItem>
      <SidebarNavItem icon={faBucket} href={`${process.env.NEXT_PUBLIC_API_URL}/produk`}>
        Produk
      </SidebarNavItem>
      <SidebarNavItem icon={faIndent} href={`${process.env.NEXT_PUBLIC_API_URL}/barang-masuk`}>
        barang masuk
      </SidebarNavItem>
      <SidebarNavItem icon={faOutdent} href={`${process.env.NEXT_PUBLIC_API_URL}/barang-keluar`}>
        barang keluar
      </SidebarNavItem>
      <SidebarNavItem icon={faUser} href={`${process.env.NEXT_PUBLIC_API_URL}/profile`}>
        Profile
      </SidebarNavItem>
    </ul>
  )
}
