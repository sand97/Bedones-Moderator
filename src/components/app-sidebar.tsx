import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users2,
  BarChart3,
  Facebook,
  Instagram,
  Music,
  MessageSquare,
  Users,
  CreditCard,
  FileText,
  HelpCircle,
  LogOut,
  UserCog,
  ChevronRight,
  ChevronsUpDown,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip';
import { useSession, useSignOut } from '~/lib/auth-client';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  disabled?: boolean;
  comingSoon?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export function AppSidebar() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { data: session } = useSession();
  const signOutMutation = useSignOut();

  const menuSections: MenuSection[] = [
    {
      title: '',
      items: [
        {
          id: 'dashboard',
          label: t('sidebar.dashboard'),
          icon: <LayoutDashboard />,
          href: '/dashboard',
        },
        {
          id: 'team',
          label: t('sidebar.team'),
          icon: <Users2 />,
          href: '/dashboard/team',
          disabled: true,
          comingSoon: true,
        },
      ],
    },
    {
      title: t('sidebar.configuration'),
      items: [
        {
          id: 'facebook',
          label: t('sidebar.facebook'),
          icon: <Facebook />,
          href: '/dashboard/facebook',
        },
        {
          id: 'instagram',
          label: t('sidebar.instagram'),
          icon: <Instagram />,
          href: '/dashboard/instagram',
        },
        {
          id: 'tiktok',
          label: t('sidebar.tiktok'),
          icon: <Music />,
          href: '/dashboard/tiktok',
          disabled: true,
          comingSoon: true,
        },
      ],
    },
    {
      title: t('sidebar.suspiciousContent'),
      items: [
        {
          id: 'commentaires',
          label: t('sidebar.comments'),
          icon: <MessageSquare />,
          href: '/dashboard/comments',
        },
        {
          id: 'followers',
          label: t('sidebar.followers'),
          icon: <Users />,
          href: '/dashboard/followers',
        },
      ],
    },
    {
      title: t('sidebar.billing'),
      items: [
        {
          id: 'payment-method',
          label: t('sidebar.paymentMethod'),
          icon: <CreditCard />,
          href: '/dashboard/payment-method',
        },
        {
          id: 'usages',
          label: t('sidebar.usages'),
          icon: <BarChart3 />,
          href: '/dashboard/usages',
        },
      ],
    },
  ];

  const getInitials = (
    name: string | null | undefined,
    email: string | null | undefined,
  ) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleLogout = async () => {
    try {
      await signOutMutation.mutateAsync();
      // Force full page reload to ensure cookie deletion is processed
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      // Redirect anyway to clear UI state
      window.location.href = '/';
    }
  };

  const handleLanguageToggle = async () => {
    const newLang = router.locale === 'fr' ? 'en' : 'fr';
    // Change i18next language immediately for instant UI update
    await i18n.changeLanguage(newLang);
    // Update Next.js router locale
    router.push(router.pathname, router.asPath, { locale: newLang });
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white font-bold">
              B
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Bedones</span>
              <span className="text-xs text-muted-foreground">Moderator</span>
            </div>
          </div>
          <button
            onClick={handleLanguageToggle}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:bg-sidebar-accent transition-colors"
            title="Switch language"
          >
            {router.locale === 'en' ? 'Français' : 'English'}
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuSections.map((section, index) => (
          <SidebarGroup key={index}>
            {section.title && (
              <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            )}
            <SidebarMenu>
              {section.items.map((item) => {
                const isActive = router.pathname === item.href;

                if (item.disabled && item.comingSoon) {
                  return (
                    <SidebarMenuItem key={item.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            className="cursor-not-allowed opacity-50"
                            disabled
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('sidebar.comingSoon')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        {item.icon}
                        <span>{item.label}</span>
                        {isActive && <ChevronRight className="ml-auto" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {/* Need Help? */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/help">
                <HelpCircle />
                <span>{t('sidebar.needHelp')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Legal Mentions */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/legal">
                <FileText />
                <span>{t('sidebar.legalMentions')}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* User Profile with Dropdown */}
          {session?.user && (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={session.user.image || undefined} />
                      <AvatarFallback className="rounded-lg">
                        {getInitials(session.user.name, session.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {session.user.name || 'User'}
                      </span>
                      <span className="truncate text-xs">
                        {session.user.email}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/account" className="cursor-pointer">
                      <UserCog className="mr-2 h-4 w-4" />
                      {t('sidebar.account')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('sidebar.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
